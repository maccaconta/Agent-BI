from django.core.management.base import BaseCommand
from apps.projects.models import DataDomain, DataSubDomain

class Command(BaseCommand):
    help = 'Popula a base com subdomínios para os domínios existentes'

    def handle(self, *args, **options):
        # 1. Canais de Atendimento
        canal, _ = DataDomain.objects.get_or_create(name='Canais de Atendimento')
        DataSubDomain.objects.get_or_create(domain=canal, name='WhatsApp e Bots')
        DataSubDomain.objects.get_or_create(domain=canal, name='Telefonia e URA')
        DataSubDomain.objects.get_or_create(domain=canal, name='Reclamações e Ouvidoria')

        # 2. Controladoria e Risco
        risco, _ = DataDomain.objects.get_or_create(name='Controladoria e Risco')
        DataSubDomain.objects.get_or_create(domain=risco, name='Crédito e Inadimplência')
        DataSubDomain.objects.get_or_create(domain=risco, name='Fraude e Compliance')
        DataSubDomain.objects.get_or_create(domain=risco, name='Tesouraria e Liquidez')

        # 3. TI
        ti, _ = DataDomain.objects.get_or_create(name='TI')
        DataSubDomain.objects.get_or_create(domain=ti, name='Infraestrutura e Cloud')
        DataSubDomain.objects.get_or_create(domain=ti, name='Segurança da Informação')
        DataSubDomain.objects.get_or_create(domain=ti, name='Arquitetura de Dados')

        # 4. Novos Domínios Sugeridos
        varejo, _ = DataDomain.objects.get_or_create(name='Varejo e Consumo')
        DataSubDomain.objects.get_or_create(domain=varejo, name='Vendas Diretas')
        DataSubDomain.objects.get_or_create(domain=varejo, name='Logística e Last Mile')
        DataSubDomain.objects.get_or_create(domain=varejo, name='Estoque e Suprimentos')

        self.stdout.write(self.style.SUCCESS('Subdomínios semeados com sucesso!'))
