import os
import sys
import django

sys.path.append(os.getcwd())
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from apps.projects.models import DataDomain, DataSubDomain
from apps.templates_lib.models import PromptTemplate

def audit():
    print("--- DATA DOMAINS ---")
    domains = DataDomain.objects.all()
    for d in domains:
        print(f"ID: {d.id} | Name: {d.name} | Tenant: {d.tenant_id}")

    print("\n--- PROMPT TEMPLATES (ALL) ---")
    prompts = PromptTemplate.objects.all()
    for p in prompts:
        print(f"ID: {p.id} | Name: {p.name} | Category: {p.category} | IsPublic: {p.is_public}")

    print("\n--- SUBDOMAINS ---")
    subs = DataSubDomain.objects.all()
    for s in subs:
        print(f"ID: {s.id} | Name: {s.name} | Domain: {s.domain_id}")

if __name__ == "__main__":
    audit()
