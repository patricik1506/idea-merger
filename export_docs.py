"""Export a complete API guide using an isolated database and fictional examples."""

import json, os, sys
from pathlib import Path

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["EMBEDDING_BACKEND"] = "hash"
os.environ.pop("ANTHROPIC_API_KEY", None)
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fastapi.testclient import TestClient
from sqlalchemy import create_engine, select
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
from app.models import Base, User
from app.main import app
from app.security import get_db

engine = create_engine(
    "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
)
Base.metadata.create_all(engine)
factory = sessionmaker(bind=engine, expire_on_commit=False)


def override():
    with factory() as db:
        yield db
        db.commit()


app.dependency_overrides[get_db] = override
clients = [TestClient(app) for _ in range(3)]
a, b, c = clients
samples = {}


def scrub(value):
    if isinstance(value, dict):
        return {
            k: ("JWT_ACCESS_TOKEN" if k == "access_token" else scrub(v))
            for k, v in value.items()
        }
    if isinstance(value, list):
        return [scrub(v) for v in value]
    return value


def call(client, method, path, body=None, template=None, record=True):
    res = (
        client.request(method, path, json=body)
        if body is not None
        else client.request(method, path)
    )
    if res.status_code >= 400:
        raise RuntimeError(f"{method} {path}: {res.status_code} {res.text}")
    data = res.json()
    if record:
        samples[(method.lower(), template or path.split("?")[0])] = {
            "request": body,
            "path": path,
            "status": res.status_code,
            "response": scrub(data),
        }
    return data


call(a, "GET", "/api/health")
for client, name in zip(clients, ["Alex Morgan", "Priya Sharma", "Moderator"]):
    call(
        client,
        "POST",
        "/api/auth/register",
        {
            "name": name,
            "email": name.split()[0].lower() + "@example.com",
            "password": "BuildTogether!2026",
            "accept_terms": True,
        },
        record=client is a,
    )
with factory.begin() as db:
    db.scalar(select(User).where(User.email == "moderator@example.com")).role = "admin"
call(
    a,
    "POST",
    "/api/auth/login",
    {"email": "alex@example.com", "password": "BuildTogether!2026"},
)
call(a, "GET", "/api/auth/me")
profile = call(a, "GET", "/api/profile")
profile.update(
    skills=["Python", "React"],
    technologies=["Python", "React"],
    interests=["Agriculture"],
    goals="Build a useful crop-health prototype.",
)
call(a, "PUT", "/api/profile", profile)
call(b, "PUT", "/api/profile", profile, record=False)
body = {
    "title": "GrowSense",
    "category": "Agriculture",
    "public_summary": "An accessible crop health platform using leaf images to detect plant disease.",
    "private_description": "Our confidential implementation includes a consented field trial and a private evaluation dataset.",
    "privacy": "summary_technologies",
    "required_skills": ["Python", "React"],
    "technologies": ["Python", "React"],
}
i = call(a, "POST", "/api/ideas", body)
body2 = {**body, "title": "LeafLens"}
j = call(b, "POST", "/api/ideas", body2, record=False)
call(a, "GET", "/api/ideas")
call(a, "GET", f"/api/ideas/{j['id']}", template="/api/ideas/{id}")
call(a, "PUT", f"/api/ideas/{i['id']}", body, template="/api/ideas/{id}")
call(
    a, "PATCH", f"/api/ideas/{i['id']}", {"archived": False}, template="/api/ideas/{id}"
)
call(a, "GET", "/api/matches?limit=20")
call(a, "GET", f"/api/matches/{j['id']}", template="/api/matches/{id}")
r = call(
    a,
    "POST",
    "/api/requests",
    {
        "source_idea_id": i["id"],
        "target_idea_id": j["id"],
        "message": "Our ideas connect. Shall we explore a prototype?",
        "consent": True,
    },
)
call(a, "GET", "/api/requests")
r = call(
    b,
    "PATCH",
    f"/api/requests/{r['id']}",
    {"action": "accept", "consent": True},
    template="/api/requests/{id}",
)
pid = r["project_id"]
call(a, "GET", "/api/projects")
call(a, "GET", f"/api/projects/{pid}", template="/api/projects/{id}")
m = call(
    a,
    "POST",
    f"/api/projects/{pid}/milestones",
    {"title": "Interview pilot users"},
    template="/api/projects/{id}/milestones",
)
call(
    a,
    "PATCH",
    f"/api/milestones/{m['id']}",
    {"done": True},
    template="/api/milestones/{id}",
)
call(
    a,
    "POST",
    f"/api/projects/{pid}/messages",
    {"text": "Let’s align on the pilot scope."},
    template="/api/projects/{id}/messages",
)
call(
    b,
    "GET",
    f"/api/projects/{pid}/messages?after=0",
    template="/api/projects/{id}/messages",
)
call(a, "POST", "/api/assistant", {"idea_id": i["id"]})
call(a, "GET", "/api/notifications")
call(a, "POST", "/api/notifications/read")
report = call(
    a,
    "POST",
    "/api/reports",
    {
        "idea_id": j["id"],
        "reason": "Please review this submission for possible copied content.",
    },
)
call(c, "GET", "/api/admin/stats")
call(c, "GET", "/api/admin/users")
call(c, "GET", "/api/admin/reports")
call(
    c,
    "PATCH",
    f"/api/admin/reports/{report['id']}",
    {"action": "dismiss"},
    template="/api/admin/reports/{id}",
)
call(
    c,
    "PATCH",
    f"/api/admin/users/{j['user_id']}",
    {"suspended": False},
    template="/api/admin/users/{id}",
)
k = call(
    a, "POST", "/api/ideas", {**body, "title": "An unaccepted draft"}, record=False
)
call(
    a,
    "POST",
    "/api/merge/preview",
    {"idea_ids": [i["id"], k["id"]], "guidance": "Combine the crop-health workflows."},
)
call(a, "DELETE", f"/api/ideas/{k['id']}", template="/api/ideas/{id}")
# An unregistered email avoids writing a local development outbox file.
call(a, "POST", "/api/auth/forgot-password", {"email": "unregistered@example.com"})
call(
    a,
    "POST",
    "/api/auth/change-password",
    {"current_password": "BuildTogether!2026", "password": "NewPassword!2026"},
)
call(
    a,
    "POST",
    "/api/auth/login",
    {"email": "alex@example.com", "password": "NewPassword!2026"},
    record=False,
)
call(a, "POST", "/api/auth/logout")
samples[("post", "/api/auth/reset-password")] = {
    "request": {"token": "TOKEN_FROM_RESET_EMAIL", "password": "NewPassword!2026"},
    "path": "/api/auth/reset-password",
    "status": 200,
    "response": {"ok": True},
}
root = Path(__file__).resolve().parents[2] / "docs"
root.mkdir(exist_ok=True)
openapi = app.openapi()
(root / "openapi.json").write_text(json.dumps(openapi, indent=2), encoding="utf-8")
lines = [
    "# REST and WebSocket API",
    "",
    "Base URL: http://127.0.0.1:8000. All bodies and responses are JSON. Browser clients use the HttpOnly `aim_session` cookie with credentials included; API clients send `Authorization: Bearer <access_token>`. The login/register response includes a bearer token but the frontend never stores it in localStorage. JWTs expire after eight hours. Logout, password reset/change and suspension revoke earlier sessions.",
    "",
    "Swagger: `/docs`; ReDoc: `/redoc`; machine contract: `/openapi.json` (also shipped beside this guide). Public endpoints are explicitly marked below; all other routes require a current unsuspended member, with additional ownership/consent/admin checks.",
    "",
    "Examples below were generated against an isolated database with fictional members and a deterministic test encoder. Scores illustrate structure, not semantic benchmark results. Actual IDs, timestamps, and scores vary. JWT tokens are redacted; reset tokens come only from the email.",
    "",
    "## Endpoint index",
    "",
    "| Method | Path | Access |",
    "| --- | --- | --- |",
]
public = {
    "/api/health",
    "/api/auth/login",
    "/api/auth/register",
    "/api/auth/forgot-password",
    "/api/auth/reset-password",
}
for path, ops in openapi["paths"].items():
    for method in ops:
        access = (
            "Public"
            if path in public
            else (
                "Administrator" if "/admin/" in path else "JWT + resource authorization"
            )
        )
        lines.append(f"| {method.upper()} | `{path}` | {access} |")
for path, ops in openapi["paths"].items():
    for method, op in ops.items():
        sample = samples.get((method, path))
        if not sample:
            raise RuntimeError("Missing sample " + method + " " + path)
        access = (
            "Public"
            if path in public
            else (
                "Administrator"
                if "/admin/" in path
                else "Authenticated member; server checks resource access"
            )
        )
        lines += [
            "",
            f"## {method.upper()} {path}",
            "",
            access + ".",
            "",
            f"Example request: `{method.upper()} {sample['path']}`",
        ]
        if op.get("parameters"):
            lines += [
                "",
                "Parameters: "
                + ", ".join(f"`{p['name']}` ({p['in']})" for p in op["parameters"])
                + ".",
            ]
        if sample["request"] is not None:
            lines += ["", "```json", json.dumps(sample["request"], indent=2), "```"]
        else:
            lines += ["", "No request body."]
        lines += [
            "",
            f"Success: HTTP {sample['status']}",
            "",
            "```json",
            json.dumps(sample["response"], indent=2),
            "```",
        ]
lines += [
    "",
    "## Errors and authorization",
    "",
    "- 400: invalid operation, reset token, or current password.\n- 401: missing/expired/revoked JWT or invalid sign-in.\n- 403: wrong owner/member/admin, absent mutual consent, suspension, or disallowed Origin.\n- 404: unavailable/missing idea, match, project, milestone, or report.\n- 409: duplicate email/request, answered request, archived idea during acceptance, or hard deletion of an accepted project idea.\n- 422: field validation, missing terms or explicit consent.\n- 429: login/register/reset/invite/chat/report/assistant throttle.\n- 503: production reset mail is not configured or the semantic embedding model is unavailable.",
    "",
    'Error example: `{"detail":"Mutual consent is required"}`. Validation errors use FastAPI’s detail array. The server never returns another person’s private description before both consent flags and accepted status are present. Visibility/archival removes ideas from discovery; accepted project participants retain their shared history.',
    "",
    "## WebSocket /ws/projects/{id}",
    "",
    'Requires an allowed Origin plus a valid current session and project membership. A browser on the same origin sends the HttpOnly cookie automatically. A client without the cookie must send `{"token":"JWT_ACCESS_TOKEN"}` as its first frame within ten seconds. Do not put bearer tokens in query strings.',
    "",
    'Server ready: `{"type":"ready"}`. Send `{"text":"Hello teammate"}` to create an encrypted stored message; receive `{"type":"message","message":{"id":1,"user_id":2,"name":"Alex Morgan","text":"Hello teammate","created_at":"2026-10-26T10:00:00+00:00"}}`.',
    "",
    'Send `{"type":"poll","after":0}` to retrieve subsequent messages as `{"type":"messages","messages":[...]}`. Membership, suspension, and token validity are rechecked on every frame. Unauthorized sockets close with code 1008. The React app uses REST polling every 2.5 seconds for a simple cross-host fallback; the socket endpoint is also tested independently. Use `wss://` in production.',
    "",
    "## Privacy levels",
    "",
    "`summary`: title/category/public summary/required skills; technology list withheld. `summary_technologies`: includes technologies. `hidden`: category and generic private label only; no original title/summary/required skills/technologies and no component match scores. A collaborator’s profile skills remain public while discoverable. Owners and exact mutually accepted collaborators receive full descriptions.",
    "",
    "## Consent sequence",
    "",
    "1. Create two active ideas owned by different members.\n2. Sender POSTs a request with `consent:true`. No private details unlock.\n3. Only recipient may accept, using `action:accept` and `consent:true`.\n4. The server records both flags, creates a project and initial milestones, and sends an acceptance notification.\n5. Only the two members may read that project’s chat and full idea details.",
    "",
]
(root / "API.md").write_text("\n".join(lines), encoding="utf-8")
print(f"Exported {len(samples)} endpoint examples and OpenAPI.")
