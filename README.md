# Infotec - Loja Demo

Projeto estático com backend Flask e SQLite, pronto para deploy no Railway ou via Docker.

## Pré-requisitos
- Python 3.10+ (recomendado)
- Docker (opcional)
- Git (para deploy via Railway conectando o repositório)

## Rodar localmente (virtualenv)
```bash
python -m venv .venv
# Windows PowerShell
.venv\Scripts\Activate.ps1
# ou CMD
.venv\Scripts\activate

pip install -r requirements.txt
python server.py
```
Acesse: http://localhost:5000

## Rodar em produção (Gunicorn)
```bash
pip install -r requirements.txt
gunicorn server:app --bind 0.0.0.0:5000
```

## Usando Docker
Build e run localmente:
```bash
docker build -t infotec-loja .
docker run -p 5000:5000 -e PORT=5000 infotec-loja
```

## Deploy no Railway (resumo)
1. Commit & push do repositório no GitHub.
2. No Railway: New Project → Deploy from GitHub → selecione o repositório.
3. Railway detecta `Procfile` ou permite usar Docker. O `Procfile` já está incluído.
4. Verifique a URL pública e teste `/api/health`.

### Observações sobre o banco
- O SQLite (`meubanco.db`) é criado automaticamente na primeira execução.
- Em ambientes de produção, arquivos locais podem não persistir entre deploys. Recomendo migrar para um banco gerenciado (Postgres) se precisar de persistência a longo prazo.

## Próximos passos sugeridos
- (Opcional) Migrar `server.py` para usar Postgres (posso ajudar).
- Testar deploy no Railway e me informar qualquer erro para eu ajustar configurações.
