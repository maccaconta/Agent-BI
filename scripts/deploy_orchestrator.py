import subprocess
import os
import time

def run_cmd(cmd):
    result = subprocess.run(cmd, shell=True, capture_output=True, text=True)
    if result.returncode != 0:
        raise Exception(f"Erro no comando: {cmd}\nOutput: {result.stderr}")
    return result.stdout.strip()

print("--- 1. Criando Par de Chaves na AWS ---")
key_name = "Agent-BI-V3"
try:
    # Tenta apagar se já existir para evitar conflito
    subprocess.run(f"aws ec2 delete-key-pair --key-name {key_name} --region us-east-1", shell=True)
    
    key_material = run_cmd(f"aws ec2 create-key-pair --key-name {key_name} --region us-east-1 --query KeyMaterial --output text")
    
    key_path = r'c:\Users\mmaccafe\Documents\Agent-BI\certs\Agent-BI-V3.pem'
    os.makedirs(os.path.dirname(key_path), exist_ok=True)
    
    # Grava o arquivo PEM de forma limpa
    with open(key_path, 'w', encoding='ascii', newline='\n') as f:
        f.write(key_material.strip() + '\n')
    
    print(f"--- 2. Ajustando Permissões (Windows icacls) ---")
    os.system(f'icacls "{key_path}" /reset')
    os.system(f'icacls "{key_path}" /inheritance:r')
    os.system(f'icacls "{key_path}" /grant:r %USERNAME%:R')
    
    print("--- 3. Lançando Instância EC2 (t3.small Free Tier) ---")
    # Usando security group que já criamos: sg-0087109b64c77f5c7
    inst_id = run_cmd(f"aws ec2 run-instances --image-id ami-009d9173b44d0482b --count 1 --instance-type t3.small --key-name {key_name} --security-group-ids sg-0087109b64c77f5c7 --tag-specifications ResourceType=instance,Tags=[{{Key=Name,Value=Agent-BI-V3}}] --region us-east-1 --query Instances[0].InstanceId --output text")
    
    print(f"Instância lançada: {inst_id}")
    print("Aguardando IP Público...")
    time.sleep(10)
    
    public_ip = run_cmd(f"aws ec2 describe-instances --instance-ids {inst_id} --region us-east-1 --query Reservations[0].Instances[0].PublicIpAddress --output text")
    
    print("\n==========================================================")
    print(f"✅ SUCESSO ABSOLUTO!")
    print(f"IP PÚBLICO: {public_ip}")
    print(f"CHAVE: {key_path}")
    print(f"COMANDO SCP: scp -i {key_path} .env dev.sqlite3 ubuntu@{public_ip}:~/")
    print(f"COMANDO SSH: ssh -i {key_path} ubuntu@{public_ip}")
    print("==========================================================")

except Exception as e:
    print(f"\n❌ ERRO CRÍTICO: {e}")
