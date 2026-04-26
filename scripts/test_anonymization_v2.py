import os
import django
import sys

# Adiciona o diretório raiz ao path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.ai_engine.services.security_service import SecurityAnonymizerService

def test_real_anonymization():
    print("--- INICIANDO TESTE DE ANONIMIZAÇÃO ---")
    columns = ["id", "nm_cliente", "email_contato", "vlr_venda", "cpf_usuario"]
    rows = [
        [1, "Marcos Silva", "marcos.silva@empresa.com", 1500.50, "123.456.789-00"],
    ]
    
    print(f"Original: {rows[0]}")
    protected_rows = SecurityAnonymizerService.anonymize_dataframe_results(columns, rows)
    print(f"Protegido: {protected_rows[0]}")
    
    if "Marcos" in str(protected_rows[0][1]):
        print("RESULTADO: FALHA")
    else:
        print("RESULTADO: SUCESSO")

if __name__ == "__main__":
    test_real_anonymization()
