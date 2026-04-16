import logging
from decimal import Decimal

logger = logging.getLogger(__name__)

class PricingService:
    """
    Serviço de precificação de modelos de IA.
    Contém as tabelas de preços oficiais (USD por 1M de tokens) e 
    fornece métodos para cálculo de custo e simulação.
    """
    
    # Preços por 1 Milhão (1M) de tokens em USD
    MODELS_PRICING = {
        "AMAZON_NOVA_PRO": {
            "name": "Amazon Nova Pro",
            "provider": "AWS",
            "input_price": 0.80,
            "output_price": 3.20
        },
        "CLAUDE_3_5_SONNET": {
            "name": "Anthropic Claude 3.5 Sonnet",
            "provider": "Anthropic",
            "input_price": 3.00,
            "output_price": 15.00
        },
        "CLAUDE_3_HAIKU": {
            "name": "Anthropic Claude 3 Haiku",
            "provider": "Anthropic",
            "input_price": 0.25,
            "output_price": 1.25
        },
        "LLAMA_3_3_70B": {
            "name": "Meta Llama 3.3 (70B)",
            "provider": "Meta",
            "input_price": 0.72,
            "output_price": 0.72  # Mesma taxa para In/Out conforme solicitado
        },
        "AMAZON_TITAN_TEXT_LITE": {
            "name": "Amazon Titan Text Lite",
            "provider": "AWS",
            "input_price": 0.30,
            "output_price": 0.40
        }
    }

    @classmethod
    def calculate_cost(cls, input_tokens: int, output_tokens: int, model_key: str = "AMAZON_NOVA_PRO") -> float:
        """Calcula o custo em USD para uma quantidade específica de tokens."""
        pricing = cls.MODELS_PRICING.get(model_key)
        if not pricing:
            logger.warning(f"[PricingService] Modelo {model_key} não encontrado. Usando Nova Pro como fallback.")
            pricing = cls.MODELS_PRICING["AMAZON_NOVA_PRO"]
            
        input_cost = (input_tokens / 1_000_000) * pricing["input_price"]
        output_cost = (output_tokens / 1_000_000) * pricing["output_price"]
        
        return round(float(input_cost + output_cost), 6)

    @classmethod
    def simulate_all_models(cls, input_tokens: int, output_tokens: int) -> list:
        """Retorna uma comparação de custos para todos os modelos suportados."""
        simulations = []
        for key, p in cls.MODELS_PRICING.items():
            cost = cls.calculate_cost(input_tokens, output_tokens, key)
            simulations.append({
                "model_key": key,
                "name": p["name"],
                "provider": p["provider"],
                "total_cost_usd": cost,
                "input_price_1m": p["input_price"],
                "output_price_1m": p["output_price"]
            })
        return simulations
