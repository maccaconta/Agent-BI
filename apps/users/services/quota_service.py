import logging
from django.db import transaction
from apps.users.models import User, UsageQuota

logger = logging.getLogger(__name__)

class QuotaService:
    """
    Serviço centralizado para gestão de quotas e consumo de IA.
    Responsável por validar limites e debitar créditos.
    """

    def check_and_increment(self, user: User) -> bool:
        """
        Verifica se o usuário tem saldo e, se sim, incrementa o uso de forma atômica.
        Retorna True se autorizado, False caso contrário.
        """
        if not user or not user.is_authenticated:
            return False

        if getattr(user, "is_super_admin", False):
            logger.info(f"[QuotaService] Bypass de quota para admin: {user.email}")
            return True

        with transaction.atomic():
            quota, created = UsageQuota.objects.get_or_create(user=user)
            
            if not quota.can_generate_report():
                logger.warning(f"[QuotaService] Limite atingido para {user.email}: {quota.reports_generated_count}/{quota.max_reports_per_month}")
                return False

            quota.increment_usage()
            logger.info(f"[QuotaService] Consumo registrado para {user.email}: {quota.reports_generated_count}/{quota.max_reports_per_month}")
            return True

    def check_token_quota(self, user: User) -> bool:
        """
        Verifica se o usuário ainda tem saldo de tokens no mês.
        Retorna True se autorizado, False se bloqueado.
        """
        if not user or not user.is_authenticated:
            return False

        if getattr(user, "is_super_admin", False):
            return True
            
        quota, _ = UsageQuota.objects.get_or_create(user=user)
        is_authorized = (quota.input_tokens_count + quota.output_tokens_count) < quota.max_tokens_monthly_limit
        
        if not is_authorized:
            logger.warning(f"[QuotaService] 🛑 BLOQUEIO POR TOKENS: {user.email} atingiu o limite de {quota.max_tokens_monthly_limit}")
            
        return is_authorized

    def log_token_usage(self, user: User, input_tokens: int, output_tokens: int):
        """Atualiza os contadores de tokens do usuário de forma atômica."""
        if not user or not user.is_authenticated:
            return

        with transaction.atomic():
            quota, _ = UsageQuota.objects.get_or_create(user=user)
            quota.input_tokens_count += input_tokens
            quota.output_tokens_count += output_tokens
            quota.save(update_fields=["input_tokens_count", "output_tokens_count", "updated_at"])
            
            logger.info(f"[QuotaService] Tokens registrados para {user.email}: +{input_tokens} in, +{output_tokens} out")

    def get_remaining_quota(self, user: User) -> int:
        """Retorna quantos relatórios o usuário ainda pode gerar."""
        if not user or not user.is_authenticated:
            return 0

        if getattr(user, "is_super_admin", False):
            return 999999
            
        quota, _ = UsageQuota.objects.get_or_create(user=user)
        remaining = quota.max_reports_per_month - quota.reports_generated_count
        return max(0, remaining)
