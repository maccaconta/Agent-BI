"""
apps.ai_engine.services.prompt_service
───────────────────────────────────────
Serviço para gestão dinâmica de prompts via Banco de Dados.
Permite alterar o comportamento dos agentes sem deploy de código.
"""
import logging
from typing import Optional
from django.core.cache import cache
from apps.governance.models import AgentSystemPrompt

logger = logging.getLogger(__name__)

class PromptService:
    """
    Centraliza o carregamento de System Prompts.
    Prioridade:
    1. Banco de Dados (PromptTemplate com categoria 'SYSTEM_PROMPT')
    2. Cache (para performance)
    3. Fallback (String hardcoded no código)
    """
    
    CACHE_TIMEOUT = 60 * 5  # 5 minutos
    
    @classmethod
    def _get_cache_key(cls, agent_name: str) -> str:
        """Centraliza a lógica de geração de chaves de cache."""
        clean_name = agent_name.replace("Agent", "").lower()
        if "data_interpreter" in clean_name:
            return "system_prompt_data_interpreter_agent"
        return f"system_prompt_{clean_name}_agent"

    @classmethod
    def get_system_prompt(cls, agent_name: str, default_content: str) -> str:
        """
        Recupera o prompt de sistema para um agente específico.
        """
        cache_key = cls._get_cache_key(agent_name)
        cached_prompt = cache.get(cache_key)
        
        if cached_prompt:
            return cached_prompt
            
        try:
            # Puxa a chave bruta para o banco (ex: supervisor_agent)
            agent_key = cache_key.replace("system_prompt_", "")
            
            template = AgentSystemPrompt.objects.filter(
                agent_key=agent_key,
                is_active=True
            ).first()
            
            if template:
                content = template.content
                cache.set(cache_key, content, cls.CACHE_TIMEOUT)
                logger.info(f"[PromptService] Prompt técnico '{agent_key}' carregado do Banco de Dados.")
                return content
                
        except Exception as e:
            logger.warning(f"[PromptService] Falha ao acessar AgentSystemPrompt no DB: {e}")
            
        logger.debug(f"[PromptService] Usando fallback local para o agente: {agent_name}")
        return default_content

    @classmethod
    def invalidate_cache(cls, agent_key: str):
        """Invalida o cache usando a chave do agente (ex: supervisor_agent)."""
        cache_key = f"system_prompt_{agent_key}"
        cache.delete(cache_key)
        logger.info(f"[PromptService] Cache invalidado para o agente: {agent_key}")
