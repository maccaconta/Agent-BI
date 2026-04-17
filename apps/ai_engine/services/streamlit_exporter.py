import zipfile
import io
import textwrap
import re
from django.utils import timezone
from apps.governance.models import WidgetScriptBinding
from apps.datasets.models import Dataset

class StreamlitExporter:
    """
    Serviço para exportar um Dashboard completo como um aplicativo Streamlit autônomo.
    """

    def generate_zip(self, dashboard):
        """
        Gera um arquivo ZIP contendo o app.py, requirements.txt e um instalador.
        """
        version = dashboard.version_count  # Usa a versão mais recente
        widgets = WidgetScriptBinding.objects.filter(dashboard=dashboard, version=version)
        
        # 0. Mapeamento de Tabelas (Lógico -> Físico)
        table_map = self._build_table_map(dashboard)
        
        # 1. Gerar o app.py
        app_code = self._generate_app_py(dashboard, widgets, table_map)
        
        # 2. Gerar requirements.txt
        requirements = "streamlit\npandas\nplotly\nsqlalchemy\npsycopg2-binary\npython-dotenv\n"

        # 3. Gerar setup.bat (Para Windows)
        setup_bat = textwrap.dedent("""
            @echo off
            echo [Agent-BI] Iniciando ambiente de execucao local...
            python -m venv venv
            call venv\\Scripts\\activate
            pip install -r requirements.txt
            echo.
            echo [Sucesso] Ambiente configurado. Abrindo Dashboard...
            streamlit run app.py
            pause
        """).strip()

        # Criar o ZIP em memória
        zip_buffer = io.BytesIO()
        with zipfile.ZipFile(zip_buffer, "w", zipfile.ZIP_DEFLATED) as zip_file:
            zip_file.writestr("app.py", app_code)
            zip_file.writestr("requirements.txt", requirements)
            zip_file.writestr("setup.bat", setup_bat)
            
        zip_buffer.seek(0)
        return zip_buffer

    def _build_table_map(self, dashboard):
        """
        Constrói mapa de De-Para (Nome Lógico -> Nome Físico) para o projeto.
        """
        project = dashboard.project
        datasets = Dataset.objects.filter(project=project)
        mapping = {}
        for ds in datasets:
            # Variação 1: Nome limpo que a IA costuma usar (sem pontos/espaços)
            logical = ds.name.lower().replace(" ", "_").replace("-", "_").replace(".", "_")
            if ds.glue_table:
                mapping[logical] = ds.glue_table
                # Variação 2: Nome original em minúsculo
                mapping[ds.name.lower()] = ds.glue_table
        return mapping

    def _generate_app_py(self, dashboard, widgets, table_map):
        """
        Gera o código fonte do Streamlit com mapeamento de tabelas.
        """
        title = dashboard.name
        generated_at = timezone.now().strftime('%d/%m/%Y %H:%M')
        
        # Função interna para traduzir o SQL
        def translate_sql(sql_content):
            if not sql_content:
                return ""
            translated = sql_content
            for logical, physical in table_map.items():
                # Usa word boundary (\b) para evitar substituições parciais perigosas
                pattern = r"\b" + re.escape(logical) + r"\b"
                translated = re.sub(pattern, physical, translated, flags=re.IGNORECASE)
            return translated

        # Header do Script
        code = textwrap.dedent(f"""
            import streamlit as st
            import pandas as pd
            import plotly.express as px
            from sqlalchemy import create_engine
            import os
            from dotenv import load_dotenv

            load_dotenv()

            # Configurações da Página NTT DATA Style
            st.set_page_config(
                page_title="{title} | Agent-BI",
                page_icon="📊",
                layout="wide",
            )

            # Estilo Customizado
            st.markdown(\"\"\"
                <style>
                .main {{ background-color: #FDFDFD; }}
                .stMetric {{ background-color: #ffffff; border: 1px solid #f0f0f0; padding: 20px; border-radius: 15px; box-shadow: 0 4px 6px rgba(0,0,0,0.02); }}
                .ntt-header {{ color: #1A1A1A; font-size: 42px; font-weight: 900; letter-spacing: -1px; font-style: italic; }}
                </style>
            \"\"\", unsafe_allow_html=True)

            # Sidebar de Conexão
            with st.sidebar:
                st.image("https://upload.wikimedia.org/wikipedia/commons/thumb/1/1a/NTT_Data_logo.svg/320px-NTT_Data_logo.svg.png", width=150)
                st.title("Configurações de Dados")
                with st.expander("🔌 Conexão com Banco de Dados", expanded=False):
                    db_type = st.selectbox("Tipo de Banco", ["SQLite", "PostgreSQL", "MySQL"])
                    if db_type == "SQLite":
                        db_path = st.text_input("Caminho do Arquivo", "data.db")
                        connection_uri = f"sqlite:///{{db_path}}"
                    else:
                        host = st.text_input("Host", os.getenv("DB_HOST", "localhost"))
                        port = st.text_input("Porta", "5432")
                        user = st.text_input("Usuário", "postgres")
                        pw = st.text_input("Senha", type="password")
                        db_name = st.text_input("Nome do Banco", "agentbi")
                        dialect = "postgresql" if db_type == "PostgreSQL" else "mysql"
                        connection_uri = f"{{dialect}}://{{user}}:{{pw}}@{{host}}:{{port}}/{{db_name}}"
                
                st.info("💡 Este dashboard foi exportado pelo Agent-BI e roda de forma independente.")

            # Título e Header
            st.markdown(f'<h1 class="ntt-header">{title}</h1>', unsafe_allow_html=True)
            st.caption(f"Gerado em {generated_at} • Strategic Analytics Agent")
            st.divider()

            # Função de Execução Segura
            def run_query(sql):
                try:
                    engine = create_engine(connection_uri)
                    return pd.read_sql(sql, engine)
                except Exception as e:
                    st.error(f"Erro ao conectar ou executar: {{e}}")
                    return pd.DataFrame()

            # Organização dos Widgets
        """).strip()

        # Separar KPIs de Gráficos
        kpis = [w for w in widgets if w.script_type == "SQL" and "BIGNUMBER" in w.prompt.upper()] # Simplificação heurística
        charts = [w for w in widgets if w not in kpis]

        # Renderizar KPIs (Grid)
        if kpis:
            code += "\n\n# --- Indicadores (KPIs) ---\n"
            cols_count = min(len(kpis), 4)
            code += f"cols = st.columns({cols_count})\n"
            for i, kpi in enumerate(kpis):
                idx = i % cols_count
                code += f"with cols[{idx}]:\n"
                translated_sql = translate_sql(kpi.script_content)
                code += f"    df_{i} = run_query(\"\"\"{translated_sql}\"\"\")\n"
                code += f"    if not df_{i}.empty:\n"
                code += f"        val = df_{i}.iloc[0, 0]\n"
                code += f"        st.metric(\"{kpi.widget_id.replace('_', ' ').title()}\", val)\n"

        # Renderizar Gráficos
        if charts:
            code += "\n\n# --- Visualizações Estratégicas ---\n"
            for i, chart in enumerate(charts):
                code += f"\nst.subheader(\"{chart.widget_id.replace('_', ' ').title()}\")\n"
                translated_sql = translate_sql(chart.script_content)
                code += f"df_c_{i} = run_query(\"\"\"{translated_sql}\"\"\")\n"
                code += f"if not df_c_{i}.empty:\n"
                # Heurística simples de gráfico baseada no prompt ou colunas
                code += f"    cols = df_c_{i}.columns\n"
                code += f"    if len(cols) >= 2:\n"
                code += f"        fig = px.bar(df_c_{i}, x=cols[0], y=cols[1], color_discrete_sequence=['#D4AF37'])\n"
                code += f"        st.plotly_chart(fig, use_container_width=True)\n"
                code += f"    else:\n"
                code += f"        st.table(df_c_{i})\n"

        code += "\n\nst.divider()\nst.caption('NTT DATA Agent-BI • Confidential Framework')"
        
        return code
