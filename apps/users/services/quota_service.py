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
        if user.is_super_admin:
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

    def get_remaining_quota(self, user: User) -> int:
        """Retorna quantos relatórios o usuário ainda pode gerar."""
        if user.is_super_admin:
            return 999999
            
        quota, _ = UsageQuota.objects.get_or_create(user=user)
        remaining = quota.max_reports_per_month - quota.reports_generated_count
        return max(0, remaining)
