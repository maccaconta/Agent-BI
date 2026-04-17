"""
apps.audit.services.trace_service
────────────────────────────────
Utilitário para rastreamento de execução em tempo real.
"""
import time
import uuid
import logging
from typing import Any, Optional
from django.utils import timezone
from apps.audit.models import ExecutionTrace

logger = logging.getLogger(__name__)

class TraceService:
    def __init__(self, trace_id: Optional[uuid.UUID] = None, job_type: str = "GENERIC", user_id=None, project_id=None, dashboard_id=None):
        self.trace_id = trace_id or uuid.uuid4()
        self.job_type = job_type
        self.user_id = user_id
        self.project_id = project_id
        self.dashboard_id = dashboard_id
        self._start_times = {}

    def start_step(self, step_name: str, message: str = None):
        """Inicia a cronometragem de um passo e persiste imediatamente para o HUD."""
        self._start_times[step_name] = time.perf_counter()
        
        # Fallbacks dinâmicos para evitar repetição excessiva
        import random
        placeholders = [
            "Orquestrando fluxos analíticos...",
            "Sincronizando metadados estratégicos...",
            "Refinando contexto de negócio...",
            "Iniciando engine de processamento...",
            "Calibrando modelos de análise...",
            "Rastreando dependências de dados..."
        ]
        display_message = message or random.choice(placeholders)
        logger.debug(f"[Tracer] [{self.trace_id}] {step_name}: {display_message}")

        # Persistência imediata do início da etapa para feedback no HUD
        try:
            ExecutionTrace.objects.create(
                trace_id=self.trace_id,
                job_type=self.job_type,
                step_name=step_name,
                message=display_message,
                status="IN_PROGRESS",
                duration_ms=0,
                user_id=self.user_id,
                project_id=self.project_id,
                dashboard_id=self.dashboard_id
            )
        except Exception as e:
            # Blindagem: se o banco estiver ocupado demais, não esperamos.
            # O timeout de 60s do settings pode travar a thread aqui, o que é ruim.
            # Logamos apenas no console para não degradar a performance da IA.
            logger.warning(f"[Tracer] ⚠️ [{step_name}] Skip persistência inicial (banco ocupado): {e}")

    def end_step(
        self, 
        step_name: str, 
        message: str = "", 
        status: str = "SUCCESS", 
        metadata: dict = None,
        input_tokens: int = 0,
        output_tokens: int = 0,
        model_id: str = ""
    ):
        """Finaliza um passo, calcula a duração e persiste o log com custo."""
        from apps.audit.services.cost_calculator import CostCalculator
        
        start_time = self._start_times.pop(step_name, time.perf_counter())
        duration_ms = int((time.perf_counter() - start_time) * 1000)
        
        # Cálculo de custo se houver tokens
        estimated_cost = CostCalculator.calculate_cost(model_id, input_tokens, output_tokens)
        
        try:
            ExecutionTrace.objects.create(
                trace_id=self.trace_id,
                job_type=self.job_type,
                step_name=step_name,
                message=message,
                duration_ms=duration_ms,
                status=status,
                metadata=metadata or {},
                input_tokens=input_tokens,
                output_tokens=output_tokens,
                model_id=model_id,
                estimated_cost_usd=estimated_cost,
                user_id=self.user_id,
                project_id=self.project_id,
                dashboard_id=self.dashboard_id
            )
            logger.info(f"[Tracer] Concluido: {step_name} em {duration_ms}ms (Custo: ${estimated_cost})")
        except Exception as e:
            # Log final é importante, mas ainda assim não deve travar a IA
            logger.warning(f"[Tracer] ⚠️ [{step_name}] Falha ao salvar log final: {e}")

    @classmethod
    def quick_log(cls, trace_id: uuid.UUID, job_type: str, step_name: str, message: str, **kwargs):
        """Log direto sem cronometragem (para eventos pontuais)."""
        try:
            ExecutionTrace.objects.create(
                trace_id=trace_id,
                job_type=job_type,
                step_name=step_name,
                message=message,
                **kwargs
            )
        except Exception as e:
            logger.warning(f"[Tracer] ⚠️ Falha no quick_log: {e}")

    def log_thought(self, assistant_name: str, thought: str, metadata: dict = None):
        """
        Registra o raciocínio/pensamento de um assistente analítico.
        """
        logger.info(f"[Tracer] 🧠 [{assistant_name}] Pensamento: {thought[:100]}...")
        try:
            # Pensamentos são puramente informativos para o HUD. 
            # Se falhar a persistência, não há impacto no resultado analítico.
            ExecutionTrace.objects.create(
                trace_id=self.trace_id,
                job_type=self.job_type,
                step_name=f"Pensamento: {assistant_name}",
                message=thought,
                status="SUCCESS",
                metadata=metadata or {}
            )
        except Exception as e:
            logger.warning(f"[Tracer] 🧠 [{assistant_name}] Pensamento ignorado no banco (DB ocupado): {e}")
