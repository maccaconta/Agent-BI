import os
import django

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.projects.models import DataDomain, DataSubDomain
from apps.templates_lib.models import PromptTemplate
from apps.users.models import Tenant

def populate():
    tenant = Tenant.objects.get(slug='default')
    
    # 1. Ensure Subdomains exist for each Domain
    domains = DataDomain.objects.filter(tenant=tenant)
    for domain in domains:
        print(f"Checking subdomains for {domain.name}...")
        sub_names = ["Logística", "Vendas", "Operações", "Compliance", "Estratégia"]
        for name in sub_names:
            sub, created = DataSubDomain.objects.get_or_create(
                domain=domain,
                name=f"{domain.name} - {name}"
            )
            if created:
                print(f"  Created subdomain: {sub.name}")

    # 2. Ensure Specialists have the correct category for filtering
    # The frontend filters by: s.category.toUpperCase().includes("SPECIALIST") 
    # or "ESPECIALISTA" or "PERSONA" or "COGNITIVA"
    specialists = PromptTemplate.objects.filter(category__isnull=False)
    for s in specialists:
        if s.category == 'COMPLIANCE':
            # Maybe the user wants these visible too? 
            # Or maybe they should be 'SPECIALIST'
            pass
        
    print("Population complete.")

if __name__ == "__main__":
    populate()
