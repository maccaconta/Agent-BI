"""
apps.audit.services.cost_calculator
───────────────────────────────────
Cálculo de custos para modelos de IA baseados em tokens.
"""
from decimal import Decimal
import logging

logger = logging.getLogger(__name__)

# Preços por 1.000 tokens (USD)
# Referência: AWS Bedrock Pricing (Abril 2024)
MODEL_PRICING = {
    # Anthropic
    "anthropic.claude-3-5-sonnet-20241022-v2:0": {
        "input": Decimal("0.003"),
        "output": Decimal("0.015"),
    },
    "anthropic.claude-3-5-sonnet-20240620-v1:0": {
        "input": Decimal("0.003"),
        "output": Decimal("0.015"),
    },
    "anthropic.claude-3-haiku-20240307-v1:0": {
        "input": Decimal("0.00025"),
        "output": Decimal("0.00125"),
    },
    
    # Amazon Nova
    "amazon.nova-pro-v1:0": {
        "input": Decimal("0.0008"),
        "output": Decimal("0.0024"),
    },
    "amazon.nova-lite-v1:0": {
        "input": Decimal("0.00006"),
        "output": Decimal("0.00024"),
    },
    "amazon.nova-micro-v1:0": {
        "input": Decimal("0.000035"),
        "output": Decimal("0.00014"),
    },
}

class CostCalculator:
    @staticmethod
    def calculate_cost(model_id: str, input_tokens: int, output_tokens: int) -> Decimal:
        """
        Calcula o custo estimado em USD para uma execução.
        """
        if not model_id or (input_tokens == 0 and output_tokens == 0):
            return Decimal("0.0")

        # Tenta match exato ou por prefixo (ex: remover região se houver)
        pricing = MODEL_PRICING.get(model_id)
        if not pricing:
            # Tenta encontrar o modelo base (remove versão/região após o último :)
            base_id = model_id.split(":")[0] if ":" in model_id else model_id
            pricing = MODEL_PRICING.get(base_id)

        if not pricing:
            logger.debug(f"[CostCalculator] Modelo desconhecido para precificação: {model_id}. Usando custo zero.")
            return Decimal("0.0")

        input_cost = (Decimal(input_tokens) / Decimal(1000)) * pricing["input"]
        output_cost = (Decimal(output_tokens) / Decimal(1000)) * pricing["output"]
        
        return input_cost + output_cost
