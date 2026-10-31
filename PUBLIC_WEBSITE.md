# Public website deployment

This is the path for an online website that stays available without ChatGPT or the owner's computer running.

## Current state

The application is prepared for a single HTTPS URL, but **no public website has been deployed**. Render was found as an available integration, but was not installed/connected when this package was prepared. Install Render, connect the account, and provide a source repository accessible to that account. Do not paste passwords or API keys into chat.

## What is included

- `Dockerfile.public`: builds React, installs FastAPI and the CPU model dependencies, caches MiniLM, and serves everything from one process/port.
- `render.yaml`: a reviewable Blueprint for the web service and persistent PostgreSQL database. These are paid compute plan examples; review the host's charges before creating them. No purchase or hosting resource was created during preparation.
- The server serves `/`, `/login`, `/dashboard`, `/merge`, and other SPA deep links. Unknown API endpoints and missing assets retain real 404 responses.
- The browser calls `/api` on the same hostname, avoiding cross-site session-cookie problems.
- Render's assigned `RENDER_EXTERNAL_URL` is recognized as an allowed origin and as the fallback base URL for reset links. Custom domains require explicit CORS_ORIGINS and FRONTEND_URL configuration.
- JWT and Fernet keys are generated as stable random values in the hosting configuration. Preserve them and the database; rotating the chat key without a migration makes old chat unreadable.
- The public build hides demo-credential autofill. Production does not run the demo seed.

## Deployment procedure

1. Install the Render integration and connect the intended hosting account.
2. Put the project source in a Git repository available to Render. Exclude local databases, `.env`, keys, model caches, environments, and node_modules; the provided source ZIP excludes them.
3. Create a Blueprint using the root `render.yaml`, or configure an equivalent Docker web service using `Dockerfile.public` plus PostgreSQL.
4. Review the selected compute/database plans and approve charges before creation. The example uses a 2 GB web-service plan to leave room for PyTorch/MiniLM; the small free web-service tier may be insufficient. This is a starting configuration, not a measured production capacity guarantee.
5. The deployment runs Alembic migrations before starting the server. Use one application worker in this initial configuration.
6. Wait for the host's health check to pass, then use the HTTPS URL assigned by the hosting service. No URL is invented in this guide.
7. Register your own account through the website and explicitly accept its terms. For administrator access, use the host's interactive shell to run `python -m app.create_admin`; do not seed public demo passwords.
8. Configure verified SMTP credentials and SMTP_FROM for delivered password-reset email. Optional ANTHROPIC_API_KEY enables Claude; otherwise the local structured merger and planning fallback remain available.
9. Verify registration, login, refresh, logout, idea creation, matching, merging, and privacy on the actual public URL before sharing it.

## Verification performed during preparation

The Python tests cover built-frontend routing, real API/asset 404s, and an optional frontend mount. Existing auth, matching, privacy, and merge tests are retained. Docker Desktop was unavailable, so this public Docker image has not been built/run here. The Blueprint syntax can be parsed locally, but it has not been remotely validated or deployed without the connected hosting account. Live PostgreSQL, TLS, SMTP and provider-specific behavior still require deployment checks.

## Official references

- [Render FastAPI hosting](https://render.com/docs/deploy-fastapi)
- [Render Blueprint specification](https://render.com/docs/blueprint-spec)
- [Render default environment variables](https://render.com/docs/environment-variables)

Keep the distinction clear: a source package is not a deployed service, and a local URL or temporary tunnel is not an always-on public deployment.
