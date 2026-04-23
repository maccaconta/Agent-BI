"""
apps.datasets.tasks
Celery tasks para processamento de datasets.
"""
from __future__ import annotations

import io
import logging
from pathlib import Path
from typing import Any

import pandas as pd
from celery import shared_task
from django.conf import settings
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task(
    bind=True,
    max_retries=3,
    default_retry_delay=30,
    name="datasets.process_dataset",
)
def process_dataset_task(self, dataset_id: str, trace_id: str | None = None):
    """
    Processa um dataset em dois modos:
    - AWS: raw no S3, parquet no S3 e registro Glue.
    - Local demo: raw/parquet em disco local, sem Glue/Athena.
    """
    from apps.datasets.models import Dataset, DatasetStatus

    try:
        dataset = Dataset.objects.get(id=dataset_id)
    except Dataset.DoesNotExist:
        logger.error("Dataset %s nao encontrado.", dataset_id)
        return

    logger.info("[DatasetTask] Iniciando processamento: %s (%s)", dataset.name, dataset_id)

    dataset.status = DatasetStatus.PROCESSING
    dataset.processing_started_at = timezone.now()
    dataset.save(update_fields=["status", "processing_started_at", "updated_at"])

    from apps.audit.services.trace_service import TraceService
    import uuid
    t_id = uuid.UUID(trace_id) if trace_id else dataset.id
    trace = TraceService(
        trace_id=t_id, 
        job_type="INGESTION",
        user_id=dataset.created_by_id,
        project_id=dataset.project_id
    )
    
    try:
        from apps.datasets.services.parquet_service import ParquetService
        
        dataset.processing_step = "Lendo Dados Brutos..."
        dataset.save(update_fields=["processing_step"])
        trace.start_step("Carregando Dados Brutos")
        use_aws_data = bool(getattr(settings, "USE_AWS_DATA_SERVICES", True))
        parquet_svc = ParquetService()
        s3 = None
        glue = None
        if use_aws_data:
            from apps.datasets.services.glue_service import GlueService
            from apps.datasets.services.s3_service import S3Service

            s3 = S3Service()
            glue = GlueService()

        raw_bytes = _load_raw_bytes(dataset=dataset, use_aws_data=use_aws_data, s3_service=s3)
        ext = (dataset.s3_original_filename or "").rsplit(".", 1)[-1].lower()
        if ext not in {"csv", "xlsx", "xls"}:
            raise ValueError(f"Extensão não suportada: {ext}")
            
        trace.end_step("Carregando Dados Brutos", message=f"Formato: {ext.upper()}")

        dataset.processing_step = "Normalizando Formatos e Enriquecendo Tipos de Dados..."
        dataset.save(update_fields=["processing_step"])
        trace.start_step("Conversão para Parquet")
        logger.info("[DatasetTask] Processando %s", ext.upper())
        
        # 1. Carregamento Único com Limites de Segurança
        try:
            if ext == "csv":
                # Usamos utf-8-sig por padrão para remover caracteres BOM invisíveis automaticamente
                encoding = "utf-8-sig"
                # Usamos sep=None com engine='python' para o Pandas detectar o delimitador automaticamente
                try:
                    df_full = pd.read_csv(
                        io.BytesIO(raw_bytes), 
                        sep=None, 
                        engine="python", 
                        encoding=encoding,
                        nrows=parquet_svc.MAX_ROWS,
                        na_values=["NULL", "null", "NaN", "nan", "N/A"],
                        keep_default_na=True,
                    )
                except UnicodeDecodeError:
                    df_full = pd.read_csv(
                        io.BytesIO(raw_bytes), 
                        sep=None, 
                        engine="python", 
                        encoding="iso-8859-1",
                        nrows=parquet_svc.MAX_ROWS,
                        na_values=["NULL", "null", "NaN", "nan", "N/A"],
                        keep_default_na=True,
                    )
            else:
                df_full = pd.read_excel(io.BytesIO(raw_bytes), nrows=parquet_svc.MAX_ROWS)
            
            # --- NORMALIZAÇÃO CRÍTICA DE COLUNAS ---
            # Remove espaços acidentais no início/fim dos nomes (ex: " id_cliente" -> "id_cliente")
            df_full.columns = [str(c).strip() for c in df_full.columns]
            # ----------------------------------------
            
            # 2. Conversão e Schema
            parquet_bytes, schema_info = parquet_svc.convert_df_to_parquet(df_full)
            schema_info = _to_json_compatible(schema_info)
            
        except Exception as conv_err:
            logger.error(f"[DatasetTask] Falha crítica de leitura: {conv_err}")
            raise ValueError(f"O arquivo {ext.upper()} não pôde ser lido: {conv_err}")

        # --- FAST SAMPLING (Performance UX) ---
        # Salva uma amostra inicial IMEDIATAMENTE antes do profiling pesado e da IA
        # Aplicamos anonimização imediata para evitar vazamento visual na UI de diagnóstico
        raw_sample = _to_json_compatible(df_full.head(100).fillna("").to_dict(orient="records"))
        
        from apps.ai_engine.services.security_service import SecurityAnonymizerService
        dataset.sample_json = SecurityAnonymizerService.anonymize_sample(raw_sample)
        dataset.save(update_fields=["sample_json"])
        # ----------------------------------------

        trace.end_step("Conversão para Parquet")

        dataset.processing_step = "Gerando Perfil Estatístico (Amostra 10k)..."
        dataset.save(update_fields=["processing_step"])
        trace.start_step("Data Profiling")
        # Gerar perfil estatístico compacto (substitui sample bruto para a LLM)
        try:
            # 1. Buscar políticas de governança do tenant (Novo Modelo GlobalAIConfig)
            from apps.governance.models import GlobalAIConfig
            policy = GlobalAIConfig.objects.filter(tenant=dataset.project.tenant, is_active=True).first()
            
            # 2. Perfil Básico (Sempre gerado - agora com Smart Sampling de 10k)
            data_profile = parquet_svc.build_data_profile(df_full, sample_size=10000)
            
            # 3. Perfil Temporal (Condicional via Governança)
            enable_temporal = policy.enable_temporal_profile if (policy and hasattr(policy, 'enable_temporal_profile')) else True
            
            if enable_temporal:
                logger.info("[DatasetTask] Gerando perfil temporal (ativado na governanca)")
                temporal_data = parquet_svc.build_temporal_profile(df_full, sample_size=20000)
                data_profile["temporal"] = temporal_data
            
            dataset.data_profile_json = _to_json_compatible(data_profile)
        except Exception as profile_exc:
            logger.warning("[DatasetTask] Falha ao gerar data_profile: %s", profile_exc)
            dataset.data_profile_json = {}
        dataset.save(update_fields=["data_profile_json", "updated_at"])
        trace.end_step("Data Profiling", message="Perfil básico e temporal concluídos")

        dataset.processing_step = "Persistindo no Data Lake Analítico..."
        dataset.save(update_fields=["processing_step"])
        trace.start_step("Persistência do Dataset")
        table_name = (
            dataset.name.lower().replace(" ", "_").replace("-", "_")[:255]
        )
        parquet_path = ""
        sqlite_table = ""
        if use_aws_data:
            project = dataset.project
            parquet_key = (
                f"{project.s3_path}/processed/{dataset.id}/"
                f"{dataset.name.lower().replace(' ', '_')}.parquet"
            )
            parquet_path = s3.upload_bytes(
                data=parquet_bytes,
                s3_key=parquet_key,
                content_type="application/octet-stream",
            )

            glue.ensure_database_exists(dataset.glue_database)
            s3_table_location = f"s3://{parquet_path.split('s3://')[-1].rsplit('/', 1)[0]}/"
            glue.create_table_from_parquet(
                database_name=dataset.glue_database,
                table_name=table_name,
                s3_location=s3_table_location,
                columns=schema_info.get("columns", []),
            )
        else:
            parquet_path = _save_local_parquet(dataset=dataset, parquet_bytes=parquet_bytes)
            from apps.datasets.services.sqlite_analytics_store import (
                LocalSQLiteAnalyticsStoreService,
            )

            sqlite_store = LocalSQLiteAnalyticsStoreService()
            # Ingestão TURBO: Envia o DataFrame diretamente para o SQLite analítico
            sqlite_table = sqlite_store.upsert_dataset_dataframe(
                dataset=dataset,
                df=df_full.fillna(""),
                schema_json=schema_info,
            )

        # No modo local ou AWS, os dados técnicos já estão prontos, mas mantemos PROCESSING
        # para a etapa de IA que vem a seguir. Fazemos um MERGE para não perder edições manuais.
        old_schema = dataset.schema_json or {}
        old_cols = {c["name"]: c for c in old_schema.get("columns", [])}
        
        new_cols = schema_info.get("columns", [])
        for col in new_cols:
            c_name = col["name"]
            if c_name in old_cols:
                # Preserva o que for "negócio" e não "técnico"
                col["description"] = old_cols[c_name].get("description") or col.get("description", "")
                col["is_key"] = old_cols[c_name].get("is_key") or col.get("is_key", False)
                col["is_historical_date"] = old_cols[c_name].get("is_historical_date") or col.get("is_historical_date", False)
                col["is_category"] = old_cols[c_name].get("is_category") or col.get("is_category", False)
                col["is_value"] = old_cols[c_name].get("is_value") or col.get("is_value", False)
                col["is_elected_for_risk"] = old_cols[c_name].get("is_elected_for_risk") or col.get("is_elected_for_risk", False)

        dataset.s3_parquet_path = parquet_path
        dataset.glue_table = table_name if use_aws_data else sqlite_table
        if not use_aws_data:
            dataset.glue_database = ""
        dataset.schema_json = schema_info
        dataset.row_count = schema_info.get("row_count", 0)
        dataset.column_count = schema_info.get("column_count", 0)
        dataset.parquet_size_bytes = schema_info.get("parquet_size_bytes", 0)
        dataset.save(update_fields=[
            "s3_parquet_path", "glue_table", "glue_database",
            "schema_json", "row_count", "column_count", "parquet_size_bytes",
            "updated_at",
        ])
        trace.end_step("Persistência do Dataset")

        # --- 4. PREPARAÇÃO DE METADADOS DEFAULT ---
        project = dataset.project
        if not project.intake_metadata:
            project.intake_metadata = {}
        
        # Garante que todas as colunas detetadas estejam selecionadas por padrão
        columns = dataset.schema_json.get("columns", [])
        all_cols = [str(c.get("name", "")) for c in columns]
        project.intake_metadata["selected_cols"] = all_cols
        project.save(update_fields=["intake_metadata", "updated_at"])

        # --- NOVA ETAPA: INFERÊNCIA SEMÂNTICA E ESTRATÉGICA (LLM) ---
        print(f"\n\n[AI_ENGINE] 🧠 Iniciando interpretação semântica para: {dataset.name}...")
        dataset.processing_step = "Interpretando Semântica de Negócio (Bedrock)..."
        dataset.save(update_fields=["processing_step"])
        trace.start_step("Enriquecimento com IA (Bedrock)")
        try:
            from apps.ai_engine.agents.data_interpreter_agent import DataInterpreterAgent
            interpreter = DataInterpreterAgent()
            
            # Analisa o schema atual e a amostra (top 10)
            columns = dataset.schema_json.get("columns", [])
            sample = dataset.sample_json[:10]
            
            # Busca domínio do projeto para carregar especialista
            domain_name = dataset.project.domain.name if dataset.project.domain else ""
            
            # Recupera Especialista de Domínio do Projeto (Persona Ativa)
            specialist_context = ""
            project = dataset.project
            if project and project.specialist_prompt:
                specialist_context = project.specialist_prompt.content
                print(f"[AI_ENGINE] 🚀 Ativando Persona Especialista: {project.specialist_prompt.name}")
                logger.info(f"[IngestionTask] Aplicando diretrizes do especialista: {project.specialist_prompt.name}")

            ai_analysis = interpreter.interpret_schema(
                columns, 
                sample, 
                domain_name=domain_name,
                specialist_context=specialist_context,
                trace=trace
            )
            
            # 1. Atualiza Descrição do Dataset (Resumo Executivo)
            if ai_analysis.get("dataset_summary") and not dataset.description:
                dataset.description = ai_analysis["dataset_summary"]
            
            # 2. Atualiza Insights Estratégicos e Diagnóstico de Fato no Perfil
            if not dataset.data_profile_json:
                dataset.data_profile_json = {}
                
            if ai_analysis.get("strategic_insights"):
                dataset.data_profile_json["ai_strategic_insights"] = ai_analysis["strategic_insights"]
            
            # Diagnóstico de Granularidade e Tabela Fato (Governance)
            if ai_analysis.get("granularity_level"):
                dataset.data_profile_json["granularity_level"] = ai_analysis["granularity_level"]
                dataset.data_profile_json["granularity_keys"] = ai_analysis.get("granularity_keys", [])
                # Compatibilidade com legacy 'is_fact_table'
                dataset.data_profile_json["is_fact_table"] = (ai_analysis["granularity_level"] == "HISTORICAL")

            # 3. Atualiza Metadados das Colunas (is_key, description, etc.)
            col_mapping = ai_analysis.get("column_mapping", {})
            # Normalização para comparação case-insensitive
            normalized_mapping = {str(k).lower().strip(): v for k, v in col_mapping.items()}
            
            for col in columns:
                col_name = str(col.get("name", ""))
                col_name_lower = col_name.lower().strip()
                
                if col_name_lower in normalized_mapping:
                    mapping = normalized_mapping[col_name_lower]
                    # Só preenche se não houver flag manual já setada
                    col["description"] = mapping.get("business_description") or col.get("description")
                    role = mapping.get("role")
                    if role == "PRIMARY_KEY": col["is_key"] = True
                    elif role == "TIME": col["is_historical_date"] = True
                    elif role == "DIMENSION": col["is_category"] = True
                    elif role == "MEASURE": col["is_value"] = True
                    
                    # --- NOVOS CAMPOS DE DOMÍNIO ---
                    col["calculation_suitability"] = mapping.get("calculation_suitability", "NONE")
                    col["usage_instructions"] = mapping.get("usage_instructions", "")
                    
                    # --- CORREÇÃO DE TIPO FÍSICO PELA IA ---
                    if mapping.get("physical_type"):
                        col["type"] = mapping["physical_type"]
                        print(f"   - [AI_TYPE_CORRECTION] {col_name} -> {mapping['physical_type']}")
                    
                    # Hint de formato de data
                    if mapping.get("date_format_hint"):
                        col["date_format_hint"] = mapping["date_format_hint"]
                    
                    # DNA de RISCO (NOVA PERSISTÊNCIA)
                    col["risk_dna_marker"] = mapping.get("risk_dna_marker")
                    col["is_elected_for_risk"] = mapping.get("is_elected_for_risk", False)
                    col["reasoning"] = mapping.get("reasoning") or col.get("reasoning")

            dataset.schema_json["columns"] = columns
            
            # --- SALVAR PLANO ESTRATÉGICO NO PROJETO ---
            if ai_analysis.get("suggested_widgets"):
                # Normalização de Widgets: Garantir que todos tenham um ID válido e esquema correto (type/subType)
                widgets = []
                for idx, w in enumerate(ai_analysis.get("suggested_widgets", [])):
                    w_id = w.get("id") or f"suggested_{w.get('type','widget').lower()}_{idx}"
                    clean_id = w_id.lower().replace(" ", "_").replace("-", "_")
                    w["id"] = clean_id
                    
                    # Normalização de Tipo (Legado -> Padrão)
                    w_type = str(w.get("type", "CHART")).upper()
                    if w_type in ["BAR", "LINE", "PIE"]:
                        w["subType"] = w_type
                        w["type"] = "CHART"
                    elif w_type == "GRID":
                        w["type"] = "TABLE"
                    
                    # Garantir que subType seja UpperCase para o Frontend
                    if w.get("subType"):
                        w["subType"] = str(w["subType"]).upper()
                        
                    widgets.append(w)

                project.intake_metadata["initial_strategic_plan"] = widgets
                project.save(update_fields=["intake_metadata", "updated_at"])
                print(f"[AI_ENGINE] 🎯 Plano estratégico ({len(widgets)} widgets) normalizado e salvo no projeto {project.name}.")

            dataset.save(update_fields=["description", "data_profile_json", "schema_json", "updated_at"])
            print(f"[AI_ENGINE] ✅ Interpretação concluída com sucesso para {dataset.name}.\n")
            trace.end_step("Enriquecimento com IA (Bedrock)", message="Resumo e metadados gerados com sucesso.")
            
        except Exception as ai_exc:
            print(f"[AI_ENGINE] ⚠️ Falha no enriquecimento IA: {ai_exc}")
            logger.warning("[DatasetTask] Falha no enriquecimento IA: %s", ai_exc)
            trace.end_step("Enriquecimento com IA (Bedrock)", status="WARNING", message=f"Pulado: {str(ai_exc)}")

        # Finalização definitiva do Dataset
        dataset.status = DatasetStatus.READY
        dataset.processing_finished_at = timezone.now()
        dataset.processing_step = ""
        dataset.processing_error = ""
        dataset.save(update_fields=["status", "processing_finished_at", "processing_step", "processing_error", "updated_at"])

        print(f"[DatasetTask] 🚀 Dataset '{dataset.name}' totalmente pronto para análise!\n")

        logger.info(
            "[DatasetTask] Concluido: %s. Linhas=%s Colunas=%s Modo=%s",
            dataset.name,
            dataset.row_count,
            dataset.column_count,
            "aws" if use_aws_data else "local",
        )

        from apps.audit.signals import audit_event

        audit_event.send(
            sender=process_dataset_task,
            action="dataset.processed",
            resource_type="Dataset",
            resource_id=dataset.id,
            extra={
                "row_count": dataset.row_count,
                "column_count": dataset.column_count,
                "glue_table": table_name if use_aws_data else "",
                "processing_mode": "aws" if use_aws_data else "local",
            },
        )
    except Exception as exc:
        logger.error("[DatasetTask] Erro ao processar dataset %s: %s", dataset_id, exc)
        dataset.status = DatasetStatus.ERROR
        dataset.processing_error = str(exc)
        dataset.processing_finished_at = timezone.now()
        dataset.save(
            update_fields=[
                "status",
                "processing_error",
                "processing_finished_at",
                "updated_at",
            ]
        )
        if 'trace' in locals():
            trace.end_step("Erro de Processamento", status="ERROR", message=str(exc))
        
        # Registrar consumo parcial em caso de erro
        _finalize_quota_usage(dataset, t_id)
        
        raise self.retry(exc=exc, countdown=60 * (self.request.retries + 1))
    finally:
        # Registrar consumo final (se bem sucedido ou erro fatal)
        if 'dataset' in locals() and 't_id' in locals():
            _finalize_quota_usage(dataset, t_id)

def _finalize_quota_usage(dataset, trace_id):
    """Agrega e persiste o consumo de tokens da task no QuotaService."""
    try:
        from apps.audit.models import ExecutionTrace
        from apps.users.services.quota_service import QuotaService
        
        traces = ExecutionTrace.objects.filter(trace_id=trace_id)
        total_in = sum(t.input_tokens for t in traces)
        total_out = sum(t.output_tokens for t in traces)
        
        if total_in > 0 or total_out > 0:
            QuotaService().log_token_usage(dataset.created_by, total_in, total_out)
    except Exception as e:
        logger.warning(f"[DatasetTask] Falha ao finalizar quota: {e}")


def _load_raw_bytes(dataset, use_aws_data: bool, s3_service=None) -> bytes:
    if use_aws_data:
        return s3_service.download_from_path(dataset.s3_raw_path)

    path_value = (dataset.s3_raw_path or "").strip()
    if not path_value.startswith("local://"):
        raise ValueError("Dataset local sem path raw valido (esperado prefixo local://).")
    local_path = Path(path_value.replace("local://", "", 1))
    if not local_path.exists():
        raise FileNotFoundError(f"Arquivo raw local nao encontrado: {local_path}")
    return local_path.read_bytes()


def _save_local_parquet(dataset, parquet_bytes: bytes) -> str:
    base_dir = Path(str(getattr(settings, "LOCAL_DATA_DIR", Path(settings.BASE_DIR) / "local_data")))
    target_dir = base_dir / "processed" / str(dataset.project_id) / str(dataset.id)
    target_dir.mkdir(parents=True, exist_ok=True)
    parquet_name = f"{dataset.name.lower().replace(' ', '_')}.parquet"
    target_file = target_dir / parquet_name
    target_file.write_bytes(parquet_bytes)
    return f"local://{target_file.as_posix()}"


def _to_json_compatible(value: Any):
    if isinstance(value, dict):
        return {str(key): _to_json_compatible(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_to_json_compatible(item) for item in value]
    if hasattr(value, "item") and callable(getattr(value, "item")):
        try:
            return value.item()
        except Exception:
            pass
    return value
