"""
apps.ai_engine.services.analytics_guardrails
Serviço de validação determinística para impedir erros analíticos comuns (ex: soma de idades).
"""
import logging
import re
import pandas as pd
from typing import Dict, Any, List, Tuple

logger = logging.getLogger(__name__)

class AnalyticsGuardrails:
    """
    Implementa verificações 'Hard Rules' que a LLM às vezes ignora.
    """
    
    # Colunas que NUNCA devem ser somadas ou ter média calculada
    PROHIBITED_AGGREGATION_KEYWORDS = [
        "idade", "age", "anos", "meses", "months", "years", 
        "id", "uuid", "pk", "key", "codigo", "cod_", "cpf", "cnpj",
        "sexo", "gender", "cep", "zipcode"
    ]


    @classmethod
    def identify_incorrect_measures(cls, column_mapping: Dict[str, Any]) -> List[str]:
        """
        Identifica colunas erroneamente classificadas como MEASURE.
        """
        fixes = []
        for col_name, info in column_mapping.items():
            name_lower = col_name.lower()
            if info.get("role") == "MEASURE":
                if any(k in name_lower for k in cls.PROHIBITED_AGGREGATION_KEYWORDS):
                    fixes.append(col_name)
        return fixes
