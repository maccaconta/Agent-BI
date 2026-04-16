"""
apps.ai_engine.services.bedrock_service
Wrapper para invocacao do Amazon Bedrock.
"""
import json
import logging
import re
import time
import uuid
from typing import Optional, Any, List, Dict

import boto3
from botocore.config import Config
from botocore.exceptions import ClientError
from django.conf import settings

logger = logging.getLogger(__name__)


class BedrockInvocationError(Exception):
    """Erro ao invocar recursos do Bedrock."""


class BedrockService:
    """
    Cliente Bedrock para:
    - invoke_model no bedrock-runtime (LLM direto)
    - invoke_agent no bedrock-agent-runtime (Agent + Alias)
    - retrieve em Knowledge Base (RAG)
    """

    MODEL_ID = "anthropic.claude-3-5-sonnet-20241022-v2:0"
    MAX_RETRIES = 3
    RETRY_DELAY = 5  # segundos
    READ_TIMEOUT = 300  # Aumentado para 5 min para evitar hangs em modelos Nova complexos

    def __init__(self):
        region = getattr(settings, "BEDROCK_REGION", "") or getattr(settings, "AWS_REGION", "us-east-1")
        self.region = region
        
        # Configura timeout para evitar que o sistema fique "travado" esperando a LLM
        config = Config(
            read_timeout=self.READ_TIMEOUT,
            connect_timeout=15,
            retries={'max_attempts': self.MAX_RETRIES}
        )
        
        # Só passamos as chaves se elas estiverem preenchidas no settings.
        # Se passarmos como "" (string vazia), o boto3 para a busca e ignora o arquivo local.
        access_key = getattr(settings, "AWS_ACCESS_KEY_ID", None)
        secret_key = getattr(settings, "AWS_SECRET_ACCESS_KEY", None)
        
        kwargs = {
            "region_name": region,
            "config": config
        }
        
        if access_key and access_key.strip():
            kwargs["aws_access_key_id"] = access_key
        if secret_key and secret_key.strip():
            kwargs["aws_secret_access_key"] = secret_key
            
        self.client = boto3.client("bedrock-runtime", **kwargs)
        
        self.model_id = getattr(settings, "BEDROCK_MODEL_ID", "") or self.MODEL_ID
        self.max_tokens = getattr(settings, "BEDROCK_MAX_TOKENS", 4000)
        self._agent_runtime_client = None
        self._kb_client = None
        self.last_invoke_metadata = {}
        self._global_config_cache = None
        self._last_config_fetch = 0

    def _get_global_config(self) -> Dict[str, Any]:
        """
        Recupera configurações globais do Banco de Dados com cache em memória (60s).
        Evita sobrecarga no DB em invocações sequenciais.
        """
        now = time.time()
        if self._global_config_cache and (now - self._last_config_fetch < 60):
            return self._global_config_cache
            
        try:
            from apps.governance.models import GlobalAIConfig
            config = GlobalAIConfig.objects.filter(is_active=True).first()
            if config:
                data = {
                    "temperature": config.temperature if config.temperature is not None else 0.3,
                    "top_p": config.top_p if config.top_p is not None else 0.9,
                    "top_k": config.top_k if config.top_k is not None else 250,
                    "max_tokens": config.max_tokens_limit if config.max_tokens_limit else self.max_tokens,
                    "persona_title": config.persona_title or "Especialista em BI",
                    "persona_description": config.persona_description or ""
                }
                self._global_config_cache = data
                self._last_config_fetch = now
                return data
        except Exception as e:
            logger.warning(f"[BedrockService] Falha ao carregar GlobalAIConfig: {e}")
            
        return {
            "temperature": 0.3,
            "top_p": 0.9,
            "top_k": 250,
            "max_tokens": self.max_tokens
        }

    def is_operational(self) -> bool:
        """Verifica se há credenciais configuradas (via settings ou ambiente/config AWS)."""
        # 1. Checa explicitamente o settings
        if getattr(settings, "AWS_ACCESS_KEY_ID", "") and getattr(settings, "AWS_SECRET_ACCESS_KEY", ""):
            return True
        
        # 2. Checa o chain do boto3 (env vars, ~/.aws/credentials, roles)
        try:
            session = boto3.Session()
            return session.get_credentials() is not None
        except:
            return False

    def invoke(
        self,
        system_prompt: str,
        user_message: Optional[str] = None,
        messages: Optional[list] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None,
        stop_sequences: Optional[list] = None,
        trace: Any = None,
    ) -> str:
        """
        Invoca modelo Foundation via bedrock-runtime.
        Suporta user_message unico ou lista de messages (history).
        """
        global_cfg = self._get_global_config()
        
        # Lógica de Precedência:
        # 1. Se o chamador especificou explicitamente (não é None), usa o valor do chamador.
        # 2. Caso contrário, usa o valor da Governança Global.
        # 3. Fallback final para defaults do serviço.
        
        # Nota: Chamadores técnicos como NL2SQL enviam temperature=0.0 explicitamente.
        # Chamadores genéricos que enviam None usarão o valor do Slider da Governança.
        
        final_temp = temperature if temperature is not None else global_cfg.get("temperature")
        if final_temp is None: final_temp = 0.3
        
        final_max_tokens = max_tokens or global_cfg.get("max_tokens") or self.max_tokens
        
        final_top_p = top_p if top_p is not None else global_cfg.get("top_p")
        if final_top_p is None: final_top_p = 0.9
        
        final_top_k = top_k if top_k is not None else global_cfg.get("top_k")
        if final_top_k is None: final_top_k = 250

        if trace and hasattr(trace, "log_thought"):
            trace.log_thought("AWS Bedrock", f"Solicitando inferência ao modelo {self.model_id.split(':')[-1] if ':' in self.model_id else self.model_id}...")
        max_tokens = max_tokens or self.max_tokens

        # Se nao houver messages, cria a partir de user_message
        if not messages:
            messages = [{"role": "user", "content": user_message}]

        # Se for modelo Nova, redireciona para a API Converse que é a compatível
        if self._should_use_converse_api():
            return self.invoke_converse(
                system_prompt=system_prompt,
                messages=messages,
                temperature=final_temp,
                max_tokens=final_max_tokens,
                top_p=final_top_p,
                top_k=final_top_k,
                trace=trace
            )

        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": final_max_tokens,
            "temperature": final_temp,
            "system": system_prompt,
            "messages": messages,
        }
        
        # Parâmetros adicionais para modelos Claude
        if final_top_p is not None:
             body["top_p"] = final_top_p
        if final_top_k is not None:
             body["top_k"] = final_top_k

        if stop_sequences:
            body["stop_sequences"] = stop_sequences

        for attempt in range(self.MAX_RETRIES):
            try:
                start_time = time.time()
                response = self.client.invoke_model(
                    modelId=self.model_id,
                    contentType="application/json",
                    accept="application/json",
                    body=json.dumps(body),
                )
                response_body = json.loads(response["body"].read())
                elapsed = time.time() - start_time

                content = response_body.get("content", [])
                if not content:
                    raise BedrockInvocationError("Resposta vazia do modelo.")

                text = content[0].get("text", "")
                usage = response_body.get("usage", {})
                if trace and hasattr(trace, "end_step"):
                    trace.end_step(
                        "AWS Bedrock Inference",
                        message=f"Inferência concluída com sucesso em {elapsed:.2f}s",
                        metadata={
                            "model_id": self.model_id,
                            "system_prompt": system_prompt,
                            "messages": messages,
                            "input_tokens": usage.get("input_tokens", 0),
                            "output_tokens": usage.get("output_tokens", 0),
                            "temperature": temperature
                        },
                        input_tokens=usage.get("input_tokens", 0),
                        output_tokens=usage.get("output_tokens", 0),
                        model_id=self.model_id
                    )

                logger.info(
                    "Bedrock invoke_model: model=%s, input_tokens=%s, output_tokens=%s, elapsed=%.2fs",
                    self.model_id,
                    usage.get("input_tokens", 0),
                    usage.get("output_tokens", 0),
                    elapsed,
                )
                return text

            except self.client.exceptions.ThrottlingException:
                if attempt < self.MAX_RETRIES - 1:
                    wait = self.RETRY_DELAY * (2**attempt)
                    logger.warning(
                        "Bedrock throttling. aguardando %ss (tentativa %s/%s)",
                        wait,
                        attempt + 1,
                        self.MAX_RETRIES,
                    )
                    time.sleep(wait)
                else:
                    raise BedrockInvocationError("Limite de taxa do Bedrock atingido apos tentativas.")

            except ClientError as exc:
                error_code = exc.response["Error"]["Code"]
                logger.error("Bedrock ClientError (%s): %s", error_code, exc)
                raise BedrockInvocationError(str(exc)) from exc

            except Exception as exc:
                logger.error("Bedrock invocation error: %s", exc)
                if attempt < self.MAX_RETRIES - 1:
                    time.sleep(self.RETRY_DELAY)
                else:
                    raise BedrockInvocationError(str(exc)) from exc

    def generate_text(
        self, 
        system_prompt: str, 
        user_message: str, 
        max_tokens: int = 500,
        temperature: Optional[float] = None,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None,
        trace: Any = None
    ) -> str:
        """Alias de compatibilidade para o método invoke."""
        return self.invoke(
            system_prompt=system_prompt, 
            user_message=user_message, 
            max_tokens=max_tokens,
            temperature=temperature,
            top_p=top_p,
            top_k=top_k,
            trace=trace
        )
    def invoke_converse(
        self,
        system_prompt: str,
        user_message: Optional[str] = None,
        messages: Optional[list] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None,
        trace: Any = None,
    ) -> str:
        """
        Invoca modelo via API Converse (necessario para familias como Amazon Nova).
        Suporta tanto user_message unico quanto lista de messages (historico).
        """
        if trace and hasattr(trace, "log_thought"):
            trace.log_thought("AWS Bedrock", f"Iniciando conversação (Converse API) com {self.model_id}...")
        
        global_cfg = self._get_global_config()
        
        # Precedência: Chamada Explicativa > Governança > Padrão
        final_temp = temperature if temperature is not None else global_cfg.get("temperature")
        if final_temp is None: final_temp = 0.3
        
        final_max_tokens = max_tokens or global_cfg.get("max_tokens") or self.max_tokens
        # Modelos Amazon Nova têm limite máximo de 10000 tokens de output
        if self._should_use_converse_api():
            final_max_tokens = min(int(final_max_tokens), 10000)
        
        final_top_p = top_p if top_p is not None else global_cfg.get("top_p")
        if final_top_p is None: final_top_p = 0.9
        
        final_top_k = top_k if top_k is not None else global_cfg.get("top_k")
        if final_top_k is None: final_top_k = 250
        
        # Log de segurança para depuração em caso de falha de validação da AWS
        logger.debug(f"[Bedrock_Converse] Parameters: temp={final_temp}, max={final_max_tokens}, top_p={final_top_p}, top_k={final_top_k}")
        
        # Constrói a lista de mensagens no formato exigido pela Converse API
        converse_messages = []
        
        if messages:
            # Converte o formato padrao (role/content) para o formato da Converse API
            for msg in messages:
                role = msg.get("role", "user")
                content = msg.get("content", "")
                
                # Formata o conteúdo para a Converse API (espera lista de blocos)
                if isinstance(content, str):
                    formatted_content = [{"text": content}]
                else:
                    formatted_content = content # Assume que já está no formato correto
                
                converse_messages.append({
                    "role": role,
                    "content": formatted_content
                })
        elif user_message:
            converse_messages = [
                {
                    "role": "user",
                    "content": [{"text": user_message}],
                }
            ]
        else:
            raise BedrockInvocationError("user_message ou messages deve ser fornecido para invoke_converse.")

        request_kwargs = {
            "modelId": self.model_id,
            "messages": converse_messages,
            "inferenceConfig": {
                "temperature": float(final_temp),
                "maxTokens": int(final_max_tokens),
                "topP": float(final_top_p),
            },
        }
        # Adiciona topK apenas se não for modelo Nova (que não suporta via inferenceConfig)
        if final_top_k is not None and not self._should_use_converse_api():
            request_kwargs["inferenceConfig"]["topK"] = int(final_top_k)
            
        if system_prompt:
            request_kwargs["system"] = [{"text": system_prompt}]

        print(f"[BedrockService] 🚀 Iniciando invocação do modelo: {self.model_id} (Região: {self.region})...")
        for attempt in range(self.MAX_RETRIES):
            try:
                start_time = time.time()
                print(f"[BedrockService] 📡 Enviando request ao endpoint Bedrock (Tentativa {attempt + 1})...")
                print(f"[BedrockService] 📦 ModelID: {self.model_id} | Payload size: approx {len(json.dumps(request_kwargs))} chars")
                
                # Chamada bloqueante ao Boto3
                response = self.client.converse(**request_kwargs)
                
                elapsed = time.time() - start_time
                print(f"[BedrockService] ✅ Resposta recebida em {elapsed:.2f}s.")

                content = (((response.get("output") or {}).get("message") or {}).get("content") or [])
                if not content:
                    raise BedrockInvocationError("Resposta vazia do modelo (converse).")

                text = content[0].get("text", "")
                usage = response.get("usage", {})
                
                if trace and hasattr(trace, "end_step"):
                    trace.end_step(
                        "AWS Bedrock Converse",
                        message=f"Inferência via Converse API concluída em {elapsed:.2f}s",
                        metadata={
                            "model_id": self.model_id,
                            "system_prompt": system_prompt,
                            "messages": messages or [{"role": "user", "content": user_message}],
                            "input_tokens": usage.get("inputTokens", 0),
                            "output_tokens": usage.get("outputTokens", 0),
                            "temperature": temperature
                        },
                        input_tokens=usage.get("inputTokens", 0),
                        output_tokens=usage.get("outputTokens", 0),
                        model_id=self.model_id
                    )

                logger.info(
                    "Bedrock converse: model=%s, input_tokens=%s, output_tokens=%s, elapsed=%.2fs",
                    self.model_id,
                    usage.get("inputTokens", 0),
                    usage.get("outputTokens", 0),
                    elapsed,
                )
                return text
            except self.client.exceptions.ThrottlingException:
                if attempt < self.MAX_RETRIES - 1:
                    wait = self.RETRY_DELAY * (2**attempt)
                    logger.warning(
                        "Bedrock throttling (converse). aguardando %ss (tentativa %s/%s)",
                        wait,
                        attempt + 1,
                        self.MAX_RETRIES,
                    )
                    time.sleep(wait)
                else:
                    raise BedrockInvocationError("Limite de taxa do Bedrock atingido apos tentativas (converse).")
            except ClientError as exc:
                error_code = exc.response["Error"]["Code"]
                logger.error("Bedrock ClientError no converse (%s): %s", error_code, exc)
                raise BedrockInvocationError(str(exc)) from exc
            except Exception as exc:
                logger.error("Bedrock converse invocation error: %s", exc)
                if attempt < self.MAX_RETRIES - 1:
                    time.sleep(self.RETRY_DELAY)
                else:
                    raise BedrockInvocationError(str(exc)) from exc

    def invoke_agent(
        self,
        user_message: str,
        session_id: Optional[str] = None,
        agent_id: Optional[str] = None,
        agent_alias_id: Optional[str] = None,
        end_session: bool = True,
        trace: Any = None,
    ) -> str:
        """
        Invoca Bedrock Agent Runtime usando agentId + agentAliasId.
        """
        if trace and hasattr(trace, "log_thought"):
            trace.log_thought("AWS Bedrock Agent", f"Delegando tarefa para o agente Bedrock {agent_id or 'padrão'}...")
        final_agent_id = agent_id or getattr(settings, "BEDROCK_AGENT_ID", "")
        final_alias_id = agent_alias_id or getattr(settings, "BEDROCK_AGENT_ALIAS_ID", "")
        if not final_agent_id or not final_alias_id:
            raise BedrockInvocationError(
                "BEDROCK_AGENT_ID e BEDROCK_AGENT_ALIAS_ID sao obrigatorios para invoke_agent."
            )

        if self._agent_runtime_client is None:
            self._agent_runtime_client = boto3.client("bedrock-agent-runtime", region_name=self.region)

        final_session_id = session_id or self._build_agent_session_id()
        enable_trace = bool(getattr(settings, "BEDROCK_AGENT_ENABLE_TRACE", False))

        try:
            start_time = time.time()
            response = self._agent_runtime_client.invoke_agent(
                agentId=final_agent_id,
                agentAliasId=final_alias_id,
                sessionId=final_session_id,
                inputText=user_message,
                enableTrace=enable_trace,
                endSession=end_session,
            )
            text = self._collect_agent_completion_text(response)
            
            # Detecção de erros retornados como texto (característica de alguns comportamentos do Bedrock)
            if "Session is terminated" in text or "AccessDenied" in text:
                logger.error(f"Erro detectado no corpo da resposta do Agent: {text}")
                raise BedrockInvocationError(f"Erro no Agent Runtime: {text}")

            elapsed = time.time() - start_time
            
            if trace and hasattr(trace, "end_step"):
                trace.end_step(
                    "AWS Bedrock Agent",
                    message=f"Tarefa executada pelo agente em {elapsed:.2f}s",
                    metadata={
                        "agent_id": final_agent_id,
                        "alias_id": final_alias_id,
                        "session_id": final_session_id,
                        "input_text": user_message,
                        "output_text": text
                    }
                )

            logger.info(
                "Bedrock invoke_agent: agent_id=%s alias_id=%s session_id=%s elapsed=%.2fs",
                final_agent_id,
                final_alias_id,
                final_session_id,
                elapsed,
            )
            return text
        except ClientError as exc:
            error_code = exc.response["Error"]["Code"]
            logger.error("Bedrock Agent ClientError (%s): %s", error_code, exc)
            raise BedrockInvocationError(str(exc)) from exc
        except Exception as exc:
            logger.error("Bedrock Agent invocation error: %s", exc)
            raise BedrockInvocationError(str(exc)) from exc

    def invoke_with_json_output(
        self,
        system_prompt: str,
        user_message: Optional[str] = None,
        messages: Optional[list] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None,
        session_id: Optional[str] = None,
        trace: Any = None,
    ) -> dict:
        """
        Invoca Bedrock e espera saida JSON.
        Suporta histórico de mensagens para sessões stateful.
        """
        json_instruction = (
            "\n\nIMPORTANTE: responda APENAS com JSON valido, "
            "sem texto adicional antes ou depois do JSON. "
            "Nao use markdown code blocks."
        )

        current_messages = []
        if messages:
            current_messages = list(messages)
            # Adiciona a instrução JSON à última mensagem do usuário se existir
            if current_messages and current_messages[-1]["role"] == "user":
                current_messages[-1]["content"] += json_instruction
        elif user_message:
            current_messages = [{"role": "user", "content": user_message + json_instruction}]
        else:
            raise ValueError("user_message ou messages deve ser fornecido.")

        metadata = {
            "provider": "bedrock",
            "model_id": self.model_id,
            "used_agent_runtime": False,
            "used_model_runtime": False,
            "model_runtime_api": "",
            "fallback_to_model_runtime": False,
            "response_origin": "",
            "success": False,
        }
        # Extrai a última mensagem para o Agent Runtime (que espera string única)
        user_message_with_json = current_messages[-1]["content"] if current_messages else ""
        used_agent_runtime = False

        if self._should_use_agent_runtime():
            print(f"[BedrockService] 🤖 Requisitando via Agent Runtime (Agent ID: {getattr(settings, 'BEDROCK_AGENT_ID', '???')})")
            used_agent_runtime = True
            metadata["used_agent_runtime"] = True
            payload = self._build_agent_input_message(system_prompt, user_message_with_json)
            try:
                response_text = self.invoke_agent(user_message=payload, session_id=session_id, end_session=False, trace=trace)
            except (BedrockInvocationError, Exception) as e:
                logger.warning(f"Falha ao invocar Agent Runtime ({e}). Tentando fallback para Model Runtime.")
                response_text = "" # Força falha no parse inicial para disparar o fallback abaixo
        else:
            if trace and hasattr(trace, "log_thought"):
                trace.log_thought("AWS Bedrock", "Requisitando via Model Runtime")
            print(f"[BedrockService] 🚀 Requisitando via Model Runtime (Model ID: {self.model_id})")
            metadata["used_model_runtime"] = True
            runtime_api, response_text = self._invoke_model_runtime(
                system_prompt=system_prompt,
                user_message=None,
                messages=current_messages,
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=top_p,
                top_k=top_k,
                trace=trace,
            )
            metadata["model_runtime_api"] = runtime_api

        parsed = self._parse_json_response(response_text)
        if parsed is not None:
            metadata["response_origin"] = "agent_runtime" if used_agent_runtime else "model_runtime"
            metadata["success"] = True
            self.last_invoke_metadata = metadata
            return parsed

        if used_agent_runtime:
            logger.warning(
                "Agent runtime retornou payload sem JSON valido. Fallback para invoke_model sera aplicado."
            )
            metadata["fallback_to_model_runtime"] = True
            metadata["used_model_runtime"] = True
            runtime_api, fallback_text = self._invoke_model_runtime(
                system_prompt=system_prompt,
                user_message=None,
                messages=current_messages,
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=top_p,
                top_k=top_k,
                trace=trace,
            )
            metadata["model_runtime_api"] = runtime_api
            parsed_fallback = self._parse_json_response(fallback_text)
            if parsed_fallback is not None:
                metadata["response_origin"] = "model_runtime_fallback_after_agent_runtime"
                metadata["success"] = True
                self.last_invoke_metadata = metadata
                return parsed_fallback
            response_text = fallback_text

        self.last_invoke_metadata = metadata
        raise BedrockInvocationError("Resposta do modelo nao e JSON valido.")

    def count_tokens_estimate(self, text: str) -> int:
        """Estimativa simples de tokens."""
        return len(text) // 4

    def retrieve_kb_context(
        self,
        query: str,
        knowledge_base_id: Optional[str] = None,
        max_results: Optional[int] = None,
    ) -> list:
        """
        Recupera contexto de uma Knowledge Base do Bedrock para RAG.
        Falhas nesta etapa nao quebram a geracao principal.
        """
        kb_id = knowledge_base_id or getattr(settings, "BEDROCK_KB_ID", "")
        text_query = (query or "").strip()
        if not kb_id or not text_query:
            return []

        if self._kb_client is None:
            self._kb_client = boto3.client("bedrock-agent-runtime", region_name=self.region)

        number_of_results = max_results or getattr(settings, "BEDROCK_KB_MAX_RESULTS", 5)
        number_of_results = max(1, min(int(number_of_results), 20))

        try:
            response = self._kb_client.retrieve(
                knowledgeBaseId=kb_id,
                retrievalQuery={"text": text_query},
                retrievalConfiguration={
                    "vectorSearchConfiguration": {
                        "numberOfResults": number_of_results,
                    }
                },
            )
        except ClientError as exc:
            logger.warning("Bedrock KB retrieve falhou: %s", exc)
            return []
        except Exception as exc:
            logger.warning("Erro inesperado no retrieve da KB: %s", exc)
            return []

        snippets = []
        for item in response.get("retrievalResults", []) or []:
            content = item.get("content") or {}
            text = (content.get("text") or "").strip()
            if not text:
                continue
            snippets.append(
                {
                    "text": text,
                    "score": item.get("score"),
                    "source": self._extract_kb_source(item.get("location") or {}),
                }
            )
        return snippets

    def _should_use_agent_runtime(self) -> bool:
        return bool(
            getattr(settings, "USE_BEDROCK_AGENT_RUNTIME", False)
            and getattr(settings, "BEDROCK_AGENT_ID", "")
            and getattr(settings, "BEDROCK_AGENT_ALIAS_ID", "")
        )

    def _invoke_model_runtime(
        self,
        system_prompt: str,
        user_message: Optional[str] = None,
        messages: Optional[list] = None,
        temperature: Optional[float] = None,
        max_tokens: Optional[int] = None,
        top_p: Optional[float] = None,
        top_k: Optional[int] = None,
        trace: Any = None,
    ) -> tuple[str, str]:
        if self._should_use_converse_api():
            return (
                "converse",
                self.invoke_converse(
                    system_prompt=system_prompt,
                    user_message=user_message,
                    messages=messages,
                    temperature=temperature,
                    max_tokens=max_tokens,
                    top_p=top_p,
                    top_k=top_k,
                    trace=trace,
                ),
            )
        return (
            "invoke_model",
            self.invoke(
                system_prompt=system_prompt,
                user_message=user_message,
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                top_p=top_p,
                top_k=top_k,
                trace=trace,
            ),
        )

    def _should_use_converse_api(self) -> bool:
        return str(self.model_id or "").strip().lower().startswith("amazon.nova")

    def _build_agent_input_message(self, system_prompt: str, user_message: str) -> str:
        return (
            "SYSTEM_CONTEXT_START\n"
            f"{system_prompt}\n"
            "SYSTEM_CONTEXT_END\n\n"
            "USER_REQUEST_START\n"
            f"{user_message}\n"
            "USER_REQUEST_END"
        )

    def _build_agent_session_id(self) -> str:
        prefix = str(getattr(settings, "BEDROCK_AGENT_SESSION_PREFIX", "agent-bi") or "agent-bi")
        safe_prefix = "".join(ch for ch in prefix if ch.isalnum() or ch in "._:-").strip("._:-")
        safe_prefix = safe_prefix or "agent-bi"
        suffix = uuid.uuid4().hex[:20]
        return f"{safe_prefix}-{suffix}"[:100]

    def _collect_agent_completion_text(self, response: dict) -> str:
        completion_stream = response.get("completion")
        if completion_stream is None:
            raise BedrockInvocationError("Resposta do Agent Runtime nao contem stream de completion.")

        parts = []
        for event in completion_stream:
            chunk = event.get("chunk")
            if not chunk:
                continue
            payload = chunk.get("bytes", b"")
            if isinstance(payload, str):
                parts.append(payload)
            elif isinstance(payload, (bytes, bytearray)):
                parts.append(payload.decode("utf-8", errors="ignore"))

        text = "".join(parts).strip()
        if not text:
            raise BedrockInvocationError("Resposta vazia do Bedrock Agent.")
        return text

    def _parse_json_response(self, response_text: str) -> dict | None:
        if not response_text:
            return None
            
        text = response_text.strip()
        
        # 1. Tentativa 1: JSON Direto (mais rápido)
        try:
            return json.loads(text)
        except json.JSONDecodeError:
            pass

        # 2. Tentativa 2: Extrair bloco de markdown ```json ... ``` com segurança
        if "```" in text:
            # Encontra o que estiver entre os primeiros ``` e os últimos ```
            try:
                # Tenta primeiro com a tag json
                match = re.search(r"```json\s*(.*?)\s*```", text, re.DOTALL)
                if not match:
                    # Tenta apenas os backticks
                    match = re.search(r"```\s*(.*?)\s*```", text, re.DOTALL)
                
                if match:
                    candidate = match.group(1).strip()
                    return json.loads(candidate)
            except (json.JSONDecodeError, AttributeError, ValueError):
                pass

        # 3. Tentativa 3: Força bruta - encontrar o primeiro { e o último }
        # Esta é a técnica mais resiliente para modelos que "falam" antes do JSON
        try:
            start = text.find("{")
            end = text.rfind("}")
            if start != -1 and end != -1 and end > start:
                json_part = text[start:end+1]
                return json.loads(json_part)
        except (json.JSONDecodeError, ValueError):
            pass

        # 4. Tentativa 4: REPARO DE TRUNCAMENTO (NOVO)
        # Se o JSON parece ter sido cortado no meio (ex: atingiu max_tokens)
        if text.startswith("{") and not text.endswith("}"):
            logger.warning("[BedrockService] Detectado JSON truncado. Tentando reparo de emergência...")
            temp_text = text
            if temp_text.endswith(","): temp_text = temp_text[:-1]
            for _ in range(5):
                try:
                    return json.loads(temp_text + "}")
                except:
                    try:
                        return json.loads(temp_text + "]}")
                    except:
                        temp_text += "}"
            
        logger.error("Falha total ao processar JSON do Bedrock. response=%s", (response_text or "")[:500])
        return None

    def _extract_kb_source(self, location: dict) -> str:
        """
        Extrai referencia textual amigavel de origem de um resultado da KB.
        """
        if not isinstance(location, dict):
            return ""

        s3_uri = (location.get("s3Location") or {}).get("uri")
        if s3_uri:
            return s3_uri

        web_url = (location.get("webLocation") or {}).get("url")
        if web_url:
            return web_url

        sql_info = location.get("sqlLocation") or {}
        query = sql_info.get("query")
        if query:
            return query

        document = location.get("documentLocation") or {}
        document_uri = document.get("uri")
        if document_uri:
            return document_uri

        return ""
