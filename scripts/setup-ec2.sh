#!/bin/bash

# --- CONFIGURAÇÕES ---
APP_DIR="Agent-BI"
REPO_URL="https://github.com/maccaconta/Agent-BI.git"

echo "=========================================================="
echo "🚀 INICIANDO SETUP ACELERADO (FREE TIER) - AGENT-BI"
echo "=========================================================="

# 1. Configurar SWAP (CRUCIAL para Free Tier de 1GB/2GB)
echo "--- (1/5) Configurando 4GB de SWAP para evitar travamentos ---"
sudo fallocate -l 4G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab
echo "SWAP configurado!"

# 2. Atualizar e Instalar Docker
echo "--- (2/5) Instalando dependências (Docker) ---"
sudo apt-get update
sudo apt-get install -y docker.io docker-compose
sudo systemctl start docker
sudo usermod -aG docker $USER

# 3. Clonar Projeto
echo "--- (3/5) Clonando repositório ---"
if [ -d "$APP_DIR" ]; then
    cd "$APP_DIR"
    git pull
else
    git clone "$REPO_URL"
    cd "$APP_DIR"
fi

# 4. Alerta de Arquivos Necessários
echo ""
echo "⚠️  STOP! PAUSA NECESSÁRIA! ⚠️"
echo "Antes de continuarmos, você precisa subir seus arquivos locais:"
echo "1. O arquivo .env"
echo "2. O arquivo dev.sqlite3"
echo ""
echo "Comando sugerido (rode na SUA MÁQUINA local):"
echo "scp .env dev.sqlite3 ubuntu@$(curl -s ifconfig.me):~/$APP_DIR/"
echo ""
read -p "Pressione [Enter] quando os arquivos estiverem no lugar..."

# 5. Build e Up
echo "--- (4/5) Subindo containers (Modo SQLite) ---"
echo "Aviso: O build do Next.js pode demorar cerca de 5-10 min devido à memória SWAP."
sudo docker-compose up -d --build

# 6. Seeds
echo "--- (5/5) Populando base de dados (Seeds) ---"
sudo docker-compose exec -T api python manage.py migrate
sudo docker-compose exec -T api python manage.py seed_agent_prompts
sudo docker-compose exec -T api python manage.py seed_specialists

echo "=========================================================="
echo "✅ SETUP CONCLUÍDO (FREE TIER)!"
echo "FRONTEND: http://$(curl -s ifconfig.me):3000"
echo "BACKEND:  http://$(curl -s ifconfig.me):8000"
echo "=========================================================="
