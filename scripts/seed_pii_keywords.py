import os
import django
import sys

# Adiciona o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.governance.models import GlobalAIConfig

def seed_pii_keywords():
    config = GlobalAIConfig.objects.filter(is_active=True).first()
    if not config:
        print("Nenhuma configuração global ativa encontrada. Criando uma nova...")
        config = GlobalAIConfig.objects.create(
            persona_title="Analista Financeiro Sênior",
            is_active=True
        )
    
    initial_keywords = {
        "cpf": "MASK_ID",
        "cnpj": "MASK_ID",
        "email": "MASK_EMAIL",
        "e-mail": "MASK_EMAIL",
        "telefone": "MASK_PHONE",
        "tel": "MASK_PHONE",
        "celular": "MASK_PHONE",
        "password": "REDACTED",
        "senha": "REDACTED",
        "credit_card": "MASK_CARD",
        "cartao": "MASK_CARD",
        "salary": "MASK_NUMBER",
        "salario": "MASK_NUMBER",
        "nome": "MASK_NAME",
        "nm_": "MASK_NAME",
        "cliente": "MASK_NAME",
        "client": "MASK_NAME",
        "social": "MASK_NAME",
        "contato": "MASK_NAME",
        "user": "MASK_NAME",
        "usr": "MASK_NAME",
        "rg": "MASK_ID",
        "endereco": "MASK_ADDRESS",
        "address": "MASK_ADDRESS"
    }
    
    config.pii_keywords_json = initial_keywords
    config.save()
    print(f"Sucesso! {len(initial_keywords)} palavras-chave de PII migradas para o banco de dados.")

if __name__ == "__main__":
    seed_pii_keywords()
