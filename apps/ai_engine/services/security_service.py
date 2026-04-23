"""
apps.ai_engine.services.security_service
Serviço central de segurança para anonimização de PII (Personally Identifiable Information).
Protege dados sensíveis tanto na amostragem para IA quanto na renderização de relatórios.
"""
import re
import logging
import hashlib
from typing import Any, Dict, List, Union

logger = logging.getLogger(__name__)

# Cache simples em memória para evitar hits repetitivos no banco durante a mesma requisição/sessão
_KEYWORDS_CACHE = {}
_CACHE_TTL = 30 # segundos
import time
_LAST_CACHE_TIME = 0

class SecurityAnonymizerService:
    # Padrões comuns de PII (Regex e Keywords)
    PII_KEYWORDS = {
        'cpf': 'MASK_ID',
        'cnpj': 'MASK_ID',
        'email': 'MASK_EMAIL',
        'e-mail': 'MASK_EMAIL',
        'telefone': 'MASK_PHONE',
        'tel': 'MASK_PHONE',
        'celular': 'MASK_PHONE',
        'password': 'REDACTED',
        'senha': 'REDACTED',
        'credit_card': 'MASK_CARD',
        'cartao': 'MASK_CARD',
        'salary': 'MASK_NUMBER',
        'salario': 'MASK_NUMBER',
        'remuneracao': 'MASK_NUMBER',
        'nome': 'MASK_NAME',
        'nm_': 'MASK_NAME',
        'nom_': 'MASK_NAME',
        'cliente': 'MASK_NAME',
        'client': 'MASK_NAME',
        'customer': 'MASK_NAME',
        'social': 'MASK_NAME',
        'contato': 'MASK_NAME',
        'contact': 'MASK_NAME',
        'user': 'MASK_NAME',
        'usr': 'MASK_NAME',
        'rg': 'MASK_ID',
        'endereco': 'MASK_ADDRESS',
        'address': 'MASK_ADDRESS'
    }

    @classmethod
    def anonymize_sample(cls, data: Any) -> Any:
        """
        Anonimiza uma lista de dicionários (amostragem de dados).
        Usado principalmente para proteger dados enviados para a LLM.
        """
        if not data or not isinstance(data, list):
            return data
        
        # Recupera as keywords uma única vez para evitar milhares de hits no banco
        keywords = cls.get_keywords()
        
        anonymized_data = []
        for row in data:
            if not isinstance(row, dict):
                anonymized_data.append(row)
                continue
                
            new_row = {}
            for col, val in row.items():
                # 1. Tenta identificar pelo nome da coluna
                mask_type = cls._get_mask_type(col, keywords)
                
                # 2. Se não identificou pelo nome, tenta identificar pelo PADRÃO do valor (Regex)
                if not mask_type and val:
                    mask_type = cls._detect_mask_type_by_value(val)
                    
                if mask_type:
                    new_row[col] = cls._apply_mask(val, mask_type)
                else:
                    new_row[col] = val
            anonymized_data.append(new_row)
            
        return anonymized_data

    @classmethod
    def _detect_mask_type_by_value(cls, value: Any) -> str | None:
        """Detecção heurística baseada em padrões de texto."""
        val_str = str(value).strip()
        if not val_str or len(val_str) < 5:
            return None
            
        # Padrão Email
        if '@' in val_str and '.' in val_str:
            if re.match(r'^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$', val_str):
                return 'MASK_EMAIL'
        
        # Padrão CPF (com ou sem máscara)
        if re.match(r'^\d{3}\.?\d{3}\.?\d{3}-?\d{2}$', val_str):
            return 'MASK_ID'
            
        # Padrão Telefone (BR)
        if re.match(r'^(\(?\d{2}\)?\s?)?(\d{4,5}-?\d{4})$', val_str):
            return 'MASK_PHONE'
            
        return None
    @classmethod
    def anonymize_dataframe_results(cls, columns: List[str], rows: List[List[Any]]) -> List[List[Any]]:
        """
        Anonimiza resultados brutos de uma consulta SQL (lista de listas).
        Usado para proteger a exibição final no Dashboard (LGPD).
        """
        if not rows or not columns:
            return rows

        # Recupera as keywords uma única vez
        keywords = cls.get_keywords()

        # Mapeia quais índices de coluna precisam de máscara
        mask_map = {}
        for idx, col in enumerate(columns):
            mask_type = cls._get_mask_type(col, keywords)
            if mask_type:
                mask_map[idx] = mask_type

        if not mask_map:
            # Se não houver máscara por nome, ainda precisamos checar por valor se necessário.
            # Mas por performance no DataFrame grande, geralmente confiamos no nome ou fazemos uma amostra.
            return rows

        anonymized_rows = []
        for row in rows:
            new_row = list(row)
            for idx, mask_type in mask_map.items():
                if idx < len(new_row):
                    new_row[idx] = cls._apply_mask(new_row[idx], mask_type)
            
            # Heurística extra: se a coluna não tem máscara mas o valor parece PII (Regex)
            # fazemos isso apenas para as primeiras 100 linhas para não matar a performance?
            # Por enquanto vamos manter simples.
            
            anonymized_rows.append(new_row)
            
        return anonymized_rows

    @classmethod
    def get_keywords(cls) -> dict:
        """
        Recupera o dicionário de PII da configuração global (banco de dados).
        Utiliza um cache em memória de curta duração para performance.
        """
        global _KEYWORDS_CACHE, _LAST_CACHE_TIME
        
        now = time.time()
        if _KEYWORDS_CACHE and (now - _LAST_CACHE_TIME < _CACHE_TTL):
            return _KEYWORDS_CACHE

        try:
            from apps.governance.models import GlobalAIConfig
            config = GlobalAIConfig.objects.filter(is_active=True).first()
            
            merged = cls.PII_KEYWORDS.copy()
            if config and config.pii_keywords_json:
                merged.update(config.pii_keywords_json)
            
            _KEYWORDS_CACHE = merged
            _LAST_CACHE_TIME = now
            return merged
        except Exception as e:
            logger.error(f"Erro ao carregar keywords do banco: {e}")
            return cls.PII_KEYWORDS

    @classmethod
    def _get_mask_type(cls, column_name: str, keywords: dict = None) -> str | None:
        name_lower = str(column_name).lower()
        if keywords is None:
            keywords = cls.get_keywords()
            
        for key, mask in keywords.items():
            if key in name_lower:
                return mask
        return None

    @classmethod
    def _apply_mask(cls, value: Any, mask_type: str) -> Any:
        if value is None:
            return None
        
        val_str = str(value)
        
        if mask_type == 'MASK_EMAIL':
            # marcos@email.com -> ma***@email.com
            parts = val_str.split('@')
            if len(parts) == 2:
                prefix = parts[0]
                masked_prefix = prefix[:2] + '***' if len(prefix) > 2 else '***'
                return f"{masked_prefix}@{parts[1]}"
            return "***@***.com"

        if mask_type == 'MASK_NAME':
            # João Silva -> Jo** Silva
            parts = val_str.split(' ')
            if len(parts) >= 2:
                return f"{parts[0][:2]}** {parts[-1]}"
            return f"{val_str[:2]}**"

        if mask_type == 'MASK_ID':
            # 123.456.789-00 -> ***.***.***-00
            if len(val_str) > 4:
                return "*" * (len(val_str) - 3) + val_str[-3:]
            return "***"

        if mask_type == 'MASK_PHONE':
            # (11) 99999-9999 -> (11) *****-9999
            if len(val_str) > 4:
                return val_str[:4] + "*****" + val_str[-4:]
            return "(**) *****-****"

        if mask_type == 'MASK_CARD':
            return "****-****-****-" + val_str[-4:] if len(val_str) > 4 else "****"

        if mask_type == 'MASK_NUMBER':
            # Para números (salários), podemos retornar uma faixa ou um valor arredondado/fictício
            # Aqui vamos apenas ofuscar para o dashboard, mantendo a escala se possível
            return "[PROTECTED_VALUE]"

        if mask_type == 'REDACTED':
            return "[REDACTED]"

        return "[PROTECTED]"
