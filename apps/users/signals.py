from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import User, UsageQuota

@receiver(post_save, sender=User)
def create_user_usage_quota(sender, instance, created, **kwargs):
    """Cria automaticamente uma quota de uso quando um novo usuário é cadastrado."""
    if created:
        UsageQuota.objects.get_or_create(user=instance)
