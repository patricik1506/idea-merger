# Windows setup

## Option A: double-click or one command

Double-click `START-WEBSITE.cmd` in the project folder after installing Python and Node.js. It opens the launcher and keeps errors visible. The same launcher can be invoked from PowerShell below.

Install Python 3.10 or newer and Node.js 22 or newer, extract the complete project, open PowerShell inside `ai-idea-merger`, then run:

```powershell
powershell -ExecutionPolicy Bypass -File .\start.ps1
```

The command-level execution-policy override applies to this invocation; it does not change the machine's global policy. The script creates the local environment and database and leaves both servers running until Ctrl+C. First-time dependency/model downloads may take several minutes and use hundreds of MB.

## Option B: manual setup

From the project root:

```powershell
python -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r backend\requirements-ai.txt
Copy-Item .env.example .env
npm --prefix frontend ci
```

Terminal 1 (the API):

```powershell
Set-Location backend
..\.venv\Scripts\python.exe -m alembic upgrade head
..\.venv\Scripts\python.exe -m app.seed
..\.venv\Scripts\python.exe -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --env-file ../.env
```

Terminal 2 (the website), from the project root:

```powershell
npm --prefix frontend run dev -- --port 5173 --strictPort
```

Open http://127.0.0.1:5173. Swagger is at http://127.0.0.1:8000/docs. Use the seeded account in the README or register your own account with explicit terms acceptance. For the complete demonstration, sign in as Alex, view the pending invitation from Daniel, accept with consent, then visit the new workspace and chat. Sign in as another demo member in a separate browser profile to try two-party messaging.

For manual seed/migration commands, environment variables can be set in PowerShell before starting Python. `uvicorn --env-file ../.env` loads configuration only for uvicorn; `start.ps1` loads it for all commands. Defaults are sufficient for local SQLite. To customize manual seed:

```powershell
$env:DEMO_PASSWORD = 'A-Unique-Long-Demo-Password'
..\.venv\Scripts\python.exe -m app.seed
```

## Configuration

| Variable | Meaning |
| --- | --- |
| APP_ENV | development or production; production refuses absent security keys |
| DATABASE_URL | SQLite locally; postgresql+psycopg URL for deployment |
| EMBEDDING_BACKEND | sentence-transformers (default); hash is explicitly demo/test-only |
| HF_HOME | Optional writable model-cache path; defaults to backend/.model-cache |
| LOCAL_STATE_DIR | Development secret location; Docker persists it in /app/runtime |
| JWT_SECRET | Long random JWT signing secret; stable across restarts |
| CHAT_ENCRYPTION_KEY | Valid Fernet key; preserve it to decrypt stored chat |
| CORS_ORIGINS | Exact comma-separated frontend origins |
| FRONTEND_URL | Public origin used in password reset emails |
| ANTHROPIC_API_KEY | Optional; blank enables rule-based planning |
| ANTHROPIC_MODEL | Claude model identifier available to your API account |
| SMTP_HOST, SMTP_PORT | SMTP host and STARTTLS port, normally 587 |
| SMTP_USER, SMTP_PASSWORD, SMTP_FROM | Email transport credentials and sender |
| DEMO_PASSWORD | Password for initial seeded accounts only |

Generate production secrets locally with:

```powershell
.\.venv\Scripts\python.exe -c "import secrets; from cryptography.fernet import Fernet; print('JWT_SECRET='+secrets.token_urlsafe(48)); print('CHAT_ENCRYPTION_KEY='+Fernet.generate_key().decode())"
```

Store them in your host's secret manager. Do not commit them or lose the chat key.

## Password reset email

With no SMTP host in development, forgot-password writes an `.eml` message under `backend/dev-mail/`. Open that local file and follow the link; reset tokens expire in 30 minutes and can only be used once. Tokens are hashed in the database and never returned by the API. Production requires SMTP for real delivery. All reset responses use a generic account-existence message.

## Tests

```powershell
.\.venv\Scripts\python.exe -m pytest backend\tests -q
npm --prefix frontend run build
```

## Troubleshooting

- **Port already in use:** stop the previous app's terminal/job. If changing the frontend port, update CORS_ORIGINS and FRONTEND_URL as well.
- **Model download/cache issue:** check internet access and the writable HF_HOME path. The Windows symlink warning does not prevent downloads. No administrator access is required.
- **Authentication fails after restart:** preserve development `.local-secrets.json`, or supply stable production secrets.
- **Chat cannot decrypt after rebuilding Docker:** preserve the runtime volume or use a stable CHAT_ENCRYPTION_KEY. Back up the key with the encrypted database.
- **Different embedding backends:** run `python -m app.reembed` after changing EMBEDDING_BACKEND. Mixing stored model versions is intentionally excluded from ranking.
- **Login rate limit:** wait 15 minutes. Attempts are tracked by IP and normalized account email.
- **Database connection error:** check the URL, PostgreSQL credentials, and database availability; apply migrations before production startup.
- **No matches:** create at least one active idea; the other member must be visible, active, and have a non-archived idea encoded by the same model.


## Idea merging demo

Sign in as Alex and open Merge ideas. GrowSense and HarvestLink are ready to select on a fresh seed. Generate a draft, review the public summary and private source record, edit any field, and save. The local structured merge works without external credentials. ANTHROPIC_API_KEY enables optional Claude synthesis; the interface labels which engine produced the draft. Source ideas are preserved. A preview alone does not create a database record.

A no-longer-running local app cannot serve a localhost link. Restart with START-WEBSITE.cmd, keep its terminal open, and reopen http://127.0.0.1:5173. If the launcher reports an occupied port, use the existing running app or stop its terminal before launching another copy.
