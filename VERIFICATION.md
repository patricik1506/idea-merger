# Public-hosting preparation — 31 October 2026

**Verified: 21 backend tests and 4 frontend routing tests passed. Both the regular frontend build and the public build passed.** The public build's JavaScript was checked to confirm that demo-credential controls are removed.

Added a single-host frontend mount with SPA deep-link support, proper missing-API/asset errors, HTML security headers, trusted Render-origin configuration, and a public full-stack Dockerfile. Tests cover direct page loading, retained API priority, missing routes/assets, optional backend-only mode, and browser cookie login on the backend origin. A Windows path-normalization issue found by the new tests was corrected.

Added render.yaml with a reviewable web-service/PostgreSQL configuration and managed generated secrets. YAML parsed locally. This configuration has **not** been remotely validated or deployed. Docker was not installed, so Docker.public has not been built/run in this environment.

Render was discovered but was not installed or connected when the package was prepared. No account, hosting service, public URL, database instance, or charge was created. Installation/connection, a deployable source repository, hosting-plan approval, and live deployment checks remain required. See docs/PUBLIC_WEBSITE.md.

---

# Login-flow correction — 31 October 2026

Verified this correction with **17 passing backend tests, 4 passing frontend routing tests, and a successful production build**.

## Fixed behavior

- The landing-page Sign in link is always visible, including narrow mobile screens. Previously the mobile stylesheet hid it and the landing header substituted a workspace destination for signed-in visitors.
- /login always displays its form. Existing users can continue their workspace or explicitly sign in again/switch accounts instead of being redirected away immediately.
- After login/register, the browser session is confirmed with /api/auth/me before navigation, so a missing cookie produces an actionable message instead of a login loop.
- Protected-page redirects preserve the requested application path, search, and fragment; unsafe/external or authentication-page return paths are rejected.
- Successful ordinary login replaces the history entry and opens the dashboard. Protected-route login returns to the original destination. Sign-out has an explicit login destination.
- Stale unauthorized responses from an older authentication generation cannot clear a newly successful login. Bootstrap connection checks have a bounded timeout and offer a connection retry instead of an indefinite loading state.

## Browser checks performed

On the running app, clicked Sign in from the landing page with an existing session and confirmed the actual login form appeared. Submitted an intentionally wrong password and verified the form retained a clear error. Submitted the correct demo credentials and reached the dashboard. Signed out, opened /merge while anonymous, signed in, and returned to /merge. Refreshed /merge and confirmed the session persisted.

On the final production build, verified Sign in at a 390-pixel viewport; its measured left/right positions were inside that viewport. Followed it to the login form, signed in successfully, and refreshed the dashboard successfully. Temporary viewport overrides were reset. Screenshots are under docs/screenshots as signin-mobile-fixed.jpg and login-flow-dashboard.jpg.

Frontend regression tests: `npm --prefix frontend test`. They verify protected return targets, default dashboard destinations, authentication-loop prevention (including mixed case), and rejection of external/malformed redirect targets.

The local API and frontend were stopped at the beginning of this report. A localhost address requires them to be running; use START-WEBSITE.cmd and keep its terminal open. This correction does not create public hosting or remove the previously documented external-service verification limits.

---

# Final verification — 31 October 2026

**Result: 17 backend tests passed; production frontend build passed.**

The original 11 tests continue to pass. Six additional checks cover merge field preservation, privacy inheritance and non-destructive saves; selection validation and owner-only access even after collaboration consent; a mocked Claude payload that excludes private source descriptions and cannot override privacy/technology fields; malformed external-AI response fallback; recoverable semantic-model failures without partial records; and oversized private-source rejection without truncation.

## Browser checks on this revision

- Signed in using the fictional Alex demo account.
- Opened Merge ideas, selected HarvestLink and GrowSense, and generated a complete local draft.
- Verified category, strictest privacy (Summary only), combined skills/technologies, and private source records.
- Edited the title to GrowLink and rewrote the public summary, then saved successfully using the real MiniLM encoder. The merged record and both originals were visible afterward.
- Built the frontend and switched to Vite's production preview on port 5173 with the FastAPI backend on port 8000. Verified the production-built merge screen and refreshed routing.
- Checked the mobile merge layout at 390 x 844. Document scroll width and client width were both 375 pixels, with no horizontal overflow. The viewport override was reset afterward.
- Browser error log was empty in the tested session. This records that session, not a guarantee against every future error.

## Documentation and launcher

Exported **37 REST endpoint examples** and the OpenAPI contract using successful calls in an isolated database. The new endpoint is POST /api/merge/preview. Windows launcher syntax was parsed successfully. The launcher now checks prerequisites and occupied ports, waits for API health, and reports backend startup failures. A double-click START-WEBSITE.cmd entry point is included. The full first-time installer was not rerun because the existing project environment was used for verification.

The sandbox initially blocked Python's event-loop socket initialization. After the user granted networking access, the API started and all tests completed. No application workaround weakened authentication or privacy.

## Remaining external verification

No live Anthropic key or SMTP credentials were supplied. The Claude request/validation/fallback paths were tested with mocks; actual provider calls and email delivery remain unverified. The local merger works without those credentials. Private descriptions stay on the application server; optional Claude synthesis receives public abstracts and the user-entered merge direction.

Docker Desktop was not available and no public host was provisioned. Docker/PostgreSQL deployment, HTTPS, and live service integration must be checked on the chosen hosting environment. This is a working local application with deployment source and instructions, not a claim of a public deployment, screenshot prevention, formal security certification, or unlimited-scale performance.

Screenshots: merge-studio.jpg, merge-review.jpg, and merge-mobile.jpg under docs/screenshots.

## Previous verification

# Verification record

Verified locally on Windows, 26 October 2026, with Python 3.10.1 and Node.js 24.11.0.

## Automated backend checks

Command: `python -m pytest backend/tests -q`

**Result: 11 passed.**

1. Exact weighted compatibility calculation: 75% for cosine=1, half skill coverage, half technology overlap.
2. Terms-required registration, unauthenticated rejection, administrator role protection, invalid login, bcrypt storage, terms timestamp.
3. No private descriptions before consent; recipient-only decisions; explicit consent; two-party unlock; third-party workspace/chat rejection; chat ciphertext; accepted-idea deletion guard.
4. Hidden metadata redaction and matching exclusions for archive, invisibility, and suspension.
5. Private description excluded from embedding input.
6. Login throttling and cross-origin mutation rejection.
7. Owner-only idea update/delete and password-change session revocation.
8. MIME-decoded email reset link; hashed token storage; one-time reset; session revocation and new-password sign-in.
9. Milestone access control; project unlock; reporting/moderation; prevention of author restoration after moderator removal; suspension blocks chat.
10. Assistant ownership checks and no-key fallback structure.
11. WebSocket member authorization, encrypted message persistence, poll frames, third-party denial, and hostile-origin denial.

Tests use isolated in-memory SQLite and a deterministic test encoder. They do not download models or send live email/API requests. SMTP delivery and live Claude output require configured external credentials and were not exercised.

## Frontend

`npm run build` succeeded with Vite 6.4.5. Browser checks covered landing, seeded sign-in, authenticated dashboard, match filtering and detail/score breakdown, assistant generation, mobile layout, mobile navigation, and light/dark themes.

At a 390 × 844 viewport override, client width and document scroll width were both 375 px (the remaining width was the scrollbar): no horizontal overflow. Mobile navigation removes the background from focus; closed mobile navigation is inert. Dialog/drawer keyboard focus is contained and restored.

Screenshots are under `docs/screenshots`. The screenshots use fictional seeded identities. Desktop and mobile views were visually inspected; this is not a complete WCAG certification or a cross-browser compatibility matrix.

## Model and seed

Installed sentence-transformers and loaded **sentence-transformers/all-MiniLM-L6-v2**. Successfully seeded one administrator, five members, five semantic embeddings, a pending invitation, and a notification. The live demo ranked real MiniLM matches. The test hashing encoder is an explicit test/demo option, not the default semantic engine.

## Database and API documentation

Applied the frozen Alembic initial migration to a fresh SQLite file. `alembic current` reported **0001 (head)**. Alembic comparison against ORM metadata found **no differences**; 13 tables included the migration-version table.

Exported OpenAPI and **36 REST endpoint examples** using successful calls against a separate in-memory database. Token values were redacted. The WebSocket protocol is documented separately.

## Deployment limits

Docker Desktop was not installed, so Docker image builds and the PostgreSQL Compose stack were not executed. No hosting account was supplied, so Render/Vercel deployment and public HTTPS were not provisioned. This delivery includes their configuration and instructions. No live SMTP or Anthropic key was available. Production operation needs those services, stable secrets, backups, and deployment-specific checks.

The application is functional locally. These results do not establish recommendation accuracy, legal enforceability, screenshot prevention, large-scale performance, or a production penetration test. Those claims require their own evidence.
