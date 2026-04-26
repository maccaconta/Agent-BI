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
    
    # 1. Simular colunas que o usuário relatou
    columns = ["id", "nm_cliente", "email_contato", "vlr_venda", "cpf_usuario"]
    
    # 2. Simular dados brutos
    rows = [
        [1, "Marcos Silva", "marcos.silva@empresa.com", 1500.50, "123.456.789-00"],
        [2, "Ana Oliveira", "ana.oli@gmail.com", 2800.00, "987.654.321-11"],
        [3, "João Souza", "joao.souza@yahoo.com.br", 450.00, "444.555.666-77"]
    ]
    
    print(f"Dados Originais (Exemplo): {rows[0]}")
    
    # 3. Executar anonimização (Layer 2 - UI)
    protected_rows = SecurityAnonymizerService.anonymize_dataframe_results(columns, rows)
    
    print("\n--- RESULTADO DA PROTEÇÃO ---")
    for i, row in enumerate(protected_rows):
        print(f"Linha {i+1} Protegida: {row}")
    
    # Verificação de Sanidade
    first_row = protected_rows[0]
    if "Marcos" in str(first_row[1]) or "@empresa.com" not in str(first_row[2]):
        print("\n❌ FALHA: Dados sensíveis ainda estão visíveis!")
    else:
        print("\n✅ SUCESSO: Dados mascarados corretamente.")
        print(f"Nome Mascarado: {first_row[1]}")
        print(f"Email Mascarado: {first_row[2]}")
        print(f"CPF Mascarado: {first_row[4]}")
        print(f"Valor (Não PII): {first_row[3]} (Mantido)")

if __name__ == "__main__":
    test_real_anonymization()
