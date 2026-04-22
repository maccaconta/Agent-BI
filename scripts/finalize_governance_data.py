import os
import django

# No need to setup django if running inside 'manage.py shell'
from apps.projects.models import DataDomain, DataSubDomain
from apps.templates_lib.models import PromptTemplate
from apps.users.models import Tenant

def run():
    try:
        tenant = Tenant.objects.get(slug='default')
    except:
        tenant = Tenant.objects.first()

    print(f"Using Tenant: {tenant.slug if tenant else 'None'}")

    # 1. Populate Subdomains
    domains = DataDomain.objects.all()
    print(f"Found {domains.count()} domains.")
    for domain in domains:
        print(f"Processing Domain: {domain.name}")
        sub_names = ["Logística", "Vendas", "Operações", "Compliance", "Estratégia"]
        for name in sub_names:
            sub, created = DataSubDomain.objects.get_or_create(
                domain=domain,
                name=f"{domain.name} - {name}"
            )
            if created:
                print(f"  Created Subdomain: {sub.name}")

    # 2. Fix Specialists Visibility
    # Ensure all Specialists are PUBLIC and have the correct category for Frontend filter
    specialists = PromptTemplate.objects.all()
    count_fixed = 0
    for s in specialists:
        updated = False
        if not s.is_public:
            s.is_public = True
            updated = True
        if not s.category or s.category == 'COMPLIANCE':
            s.category = 'SPECIALIST'
            updated = True
        
        if updated:
            s.save()
            count_fixed += 1
    
    print(f"Fixed {count_fixed} specialists visibility/category.")
    print("Execution Finished Successfully.")

if __name__ == "__main__":
    run()
