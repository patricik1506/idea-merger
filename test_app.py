import os
import sys
from pathlib import Path
import pytest

os.environ["DATABASE_URL"] = "sqlite://"
os.environ["EMBEDDING_BACKEND"] = "hash"
from sqlalchemy import create_engine, select
from sqlalchemy.pool import StaticPool
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from app.main import app
from app.models import Base, User, Profile, Idea, Message, TermsAcceptance
from app.security import get_db, hash_password
from app.matching import embed, score


@pytest.fixture
def clients():
    engine = create_engine(
        "sqlite://", connect_args={"check_same_thread": False}, poolclass=StaticPool
    )
    Base.metadata.create_all(engine)
    factory = sessionmaker(bind=engine, expire_on_commit=False)

    def override():
        with factory() as db:
            try:
                yield db
                db.commit()
            except Exception:
                db.rollback()
                raise

    app.dependency_overrides[get_db] = override
    a, b, c = TestClient(app), TestClient(app), TestClient(app)
    for client, name in [(a, "alice"), (b, "bob"), (c, "cara")]:
        res = client.post(
            "/api/auth/register",
            json={
                "name": name,
                "email": name + "@example.com",
                "password": "StrongPassword!",
                "accept_terms": True,
            },
        )
        assert res.status_code == 201, res.text
    yield a, b, c, factory
    app.dependency_overrides.clear()


def idea(client, privacy="summary_technologies"):
    r = client.post(
        "/api/ideas",
        json={
            "title": "Plant health AI",
            "category": "Agriculture",
            "public_summary": "Detect crop diseases using leaf images and machine learning.",
            "private_description": "SECRET: our dataset and proprietary evaluation procedure stay confidential.",
            "privacy": privacy,
            "required_skills": ["Python"],
            "technologies": ["Python", "React"],
        },
    )
    assert r.status_code == 201, r.text
    return r.json()


def test_matching_formula():
    from types import SimpleNamespace as Obj

    a = Obj(
        embedding=[1, 0],
        embedding_model="x",
        required_skills=["Python", "React"],
        technologies=["Python", "React"],
    )
    b = Obj(embedding=[1, 0], embedding_model="x", technologies=["Python"])
    result = score(a, b, ["Python"])
    assert result == {
        "score": 75.0,
        "idea_similarity": 100.0,
        "skill_fit": 50.0,
        "technology_overlap": 50.0,
    }


def test_auth_terms_and_roles(clients):
    a, b, c, factory = clients
    assert TestClient(app).get("/api/ideas").status_code == 401
    r = a.post(
        "/api/auth/register",
        json={
            "name": "No Terms",
            "email": "terms@example.com",
            "password": "StrongPassword!",
            "accept_terms": False,
        },
    )
    assert r.status_code == 422
    assert a.get("/api/admin/users").status_code == 403
    assert (
        a.post(
            "/api/auth/login", json={"email": "alice@example.com", "password": "wrong"}
        ).status_code
        == 401
    )
    with factory() as db:
        assert db.scalar(select(TermsAcceptance)).accepted_at
        assert db.scalar(select(User)).password_hash != "StrongPassword!"


def test_privacy_and_mutual_consent(clients):
    a, b, c, factory = clients
    own = idea(a)
    target = idea(b)
    assert "private_description" not in a.get("/api/ideas/" + str(target["id"])).json()
    assert a.put("/api/ideas/" + str(target["id"]), json={}).status_code == 422
    req = a.post(
        "/api/requests",
        json={
            "source_idea_id": own["id"],
            "target_idea_id": target["id"],
            "consent": True,
        },
    ).json()
    assert "private_description" not in a.get("/api/ideas/" + str(target["id"])).json()
    assert (
        c.patch(
            "/api/requests/" + str(req["id"]),
            json={"action": "accept", "consent": True},
        ).status_code
        == 403
    )
    assert (
        b.patch(
            "/api/requests/" + str(req["id"]), json={"action": "accept"}
        ).status_code
        == 422
    )
    accepted = b.patch(
        "/api/requests/" + str(req["id"]), json={"action": "accept", "consent": True}
    )
    assert accepted.status_code == 200, accepted.text
    pid = accepted.json()["project_id"]
    assert (
        a.get("/api/ideas/" + str(target["id"]))
        .json()["private_description"]
        .startswith("SECRET")
    )
    assert "private_description" not in c.get("/api/ideas/" + str(target["id"])).json()
    assert c.get(f"/api/projects/{pid}").status_code == 403
    assert c.get(f"/api/projects/{pid}/messages").status_code == 403
    sent = a.post(f"/api/projects/{pid}/messages", json={"text": "private hello"})
    assert sent.status_code == 201, sent.text
    assert b.get(f"/api/projects/{pid}/messages").json()[0]["text"] == "private hello"
    with factory() as db:
        assert "private hello" not in db.scalar(select(Message)).ciphertext
    assert a.delete("/api/ideas/" + str(own["id"])).status_code == 409


def test_hidden_and_matching_exclusions(clients):
    a, b, c, factory = clients
    idea(a)
    hidden = idea(b, "hidden")
    view = a.get("/api/ideas/" + str(hidden["id"])).json()
    assert view["title"] == "Private Agriculture idea"
    assert view["technologies"] == []
    assert "Detect crop" not in str(view)
    matches = a.get("/api/matches").json()
    assert len(matches) == 1 and matches[0]["idea_similarity"] is None
    b.patch("/api/ideas/" + str(hidden["id"]), json={"archived": True})
    assert a.get("/api/matches").json() == []
    b.patch("/api/ideas/" + str(hidden["id"]), json={"archived": False})
    p = b.get("/api/profile").json()
    p["visible"] = False
    b.put("/api/profile", json=p)
    assert a.get("/api/matches").json() == []
    with factory.begin() as db:
        profile = db.get(Profile, hidden["user_id"])
        profile.visible = True
        db.get(User, hidden["user_id"]).suspended = True
    assert a.get("/api/matches").json() == []


def test_private_description_not_embedded(clients):
    a, b, c, factory = clients
    i = idea(a)
    with factory() as db:
        stored = db.get(Idea, i["id"])
        vector, _ = embed(stored.title, stored.category, stored.public_summary)
        assert stored.embedding == vector


def test_login_rate_limit_and_origin(clients):
    a, b, c, factory = clients
    for _ in range(8):
        a.post(
            "/api/auth/login", json={"email": "nobody@example.com", "password": "wrong"}
        )
    assert (
        a.post(
            "/api/auth/login", json={"email": "nobody@example.com", "password": "wrong"}
        ).status_code
        == 429
    )
    assert (
        a.post(
            "/api/auth/logout", headers={"Origin": "https://attacker.example"}
        ).status_code
        == 403
    )


def test_owner_only_update_delete_and_password_revocation(clients):
    a, b, c, factory = clients
    i = idea(b)
    body = {
        k: v
        for k, v in i.items()
        if k
        in (
            "title",
            "category",
            "private_description",
            "public_summary",
            "privacy",
            "required_skills",
            "technologies",
        )
    }
    assert a.put("/api/ideas/" + str(i["id"]), json=body).status_code == 403
    assert a.delete("/api/ideas/" + str(i["id"])).status_code == 403
    assert (
        a.post(
            "/api/auth/change-password",
            json={"current_password": "StrongPassword!", "password": "NewPassword!123"},
        ).status_code
        == 200
    )
    assert a.get("/api/auth/me").status_code == 401


def test_reset_token_is_single_use_and_revokes_sessions(clients, tmp_path, monkeypatch):
    import re
    from app.models import ResetToken

    a, b, c, factory = clients
    monkeypatch.chdir(tmp_path)
    response = a.post("/api/auth/forgot-password", json={"email": "alice@example.com"})
    assert response.status_code == 200
    from email import message_from_string

    mail = (
        message_from_string(next((tmp_path / "dev-mail").glob("*.eml")).read_text())
        .get_payload(decode=True)
        .decode()
    )
    raw = re.search(r"token=([A-Za-z0-9_-]+)", mail).group(1)
    with factory() as db:
        assert db.scalar(select(ResetToken)).digest != raw
    assert (
        a.post(
            "/api/auth/reset-password",
            json={"token": raw, "password": "ResetPassword!123"},
        ).status_code
        == 200
    )
    assert a.get("/api/auth/me").status_code == 401
    assert (
        a.post(
            "/api/auth/reset-password",
            json={"token": raw, "password": "ResetPassword!123"},
        ).status_code
        == 400
    )
    assert (
        a.post(
            "/api/auth/login",
            json={"email": "alice@example.com", "password": "ResetPassword!123"},
        ).status_code
        == 200
    )


def test_workspace_milestones_reports_and_moderation(clients):
    a, b, c, factory = clients
    own = idea(a)
    target = idea(b)
    r = a.post(
        "/api/requests",
        json={
            "source_idea_id": own["id"],
            "target_idea_id": target["id"],
            "consent": True,
        },
    ).json()
    p = b.patch(
        "/api/requests/" + str(r["id"]), json={"action": "accept", "consent": True}
    ).json()["project_id"]
    m = a.post(
        f"/api/projects/{p}/milestones", json={"title": "Validate the prototype"}
    ).json()
    assert (
        c.patch("/api/milestones/" + str(m["id"]), json={"done": True}).status_code
        == 403
    )
    assert (
        b.patch("/api/milestones/" + str(m["id"]), json={"done": True}).json()["done"]
        is True
    )
    assert len(a.get(f"/api/projects/{p}").json()["ideas"]) == 2
    report = a.post(
        "/api/reports",
        json={"idea_id": target["id"], "reason": "Possible copied idea needing review"},
    ).json()
    with factory.begin() as db:
        member = db.scalar(select(User).where(User.email == "cara@example.com"))
        member.role = "admin"
    assert c.get("/api/admin/stats").status_code == 200
    assert (
        c.patch(
            "/api/admin/reports/" + str(report["id"]), json={"action": "remove"}
        ).status_code
        == 200
    )
    assert a.get("/api/matches").json() == []
    assert (
        b.patch("/api/ideas/" + str(target["id"]), json={"archived": False}).status_code
        == 403
    )
    assert (
        c.patch(
            "/api/admin/users/" + str(target["user_id"]), json={"suspended": True}
        ).status_code
        == 200
    )
    assert b.get("/api/auth/me").status_code == 401
    assert a.get(f"/api/projects/{p}/messages").status_code == 403


def test_assistant_fallback_and_ownership(clients, monkeypatch):
    a, b, c, factory = clients
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    i = idea(a)
    assert b.post("/api/assistant", json={"idea_id": i["id"]}).status_code == 403
    result = a.post("/api/assistant", json={"idea_id": i["id"]}).json()
    assert result["provider"] == "rule-based"
    assert set(result["result"]) == {"titles", "features", "tech_stack", "roadmap"}


def test_websocket_membership_and_encryption(clients, monkeypatch):
    import app.main as main
    from starlette.websockets import WebSocketDisconnect

    a, b, c, factory = clients
    monkeypatch.setattr(main, "SessionLocal", factory)
    own = idea(a)
    target = idea(b)
    r = a.post(
        "/api/requests",
        json={
            "source_idea_id": own["id"],
            "target_idea_id": target["id"],
            "consent": True,
        },
    ).json()
    pid = b.patch(
        "/api/requests/" + str(r["id"]), json={"action": "accept", "consent": True}
    ).json()["project_id"]
    with a.websocket_connect(
        f"/ws/projects/{pid}", headers={"origin": "http://127.0.0.1:5173"}
    ) as ws:
        assert ws.receive_json()["type"] == "ready"
        ws.send_json({"text": "An encrypted WebSocket message"})
        assert ws.receive_json()["message"]["text"] == "An encrypted WebSocket message"
        ws.send_json({"type": "poll", "after": 0})
        assert len(ws.receive_json()["messages"]) == 1
    with pytest.raises(WebSocketDisconnect):
        with c.websocket_connect(
            f"/ws/projects/{pid}", headers={"origin": "http://127.0.0.1:5173"}
        ) as ws:
            ws.receive_json()
    with pytest.raises(WebSocketDisconnect):
        with a.websocket_connect(
            f"/ws/projects/{pid}", headers={"origin": "https://attacker.example"}
        ) as ws:
            ws.receive_json()


def test_merge_preview_preserves_fields_privacy_and_originals(clients, monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    a, b, c, factory = clients
    first = idea(a, "summary")
    second = idea(a, "hidden")
    assert (
        TestClient(app)
        .post("/api/merge/preview", json={"idea_ids": [first["id"], second["id"]]})
        .status_code
        == 401
    )
    response = a.post(
        "/api/merge/preview",
        json={
            "idea_ids": [first["id"], second["id"]],
            "guidance": "Connect the crop-health workflows.",
        },
    )
    assert response.status_code == 200, response.text
    preview = response.json()
    draft = preview["draft"]
    assert preview["provider"] == "local structured merge"
    assert draft["privacy"] == "hidden"
    assert draft["category"] == "Agriculture"
    assert draft["technologies"] == ["Python", "React"]
    assert draft["required_skills"] == ["Python"]
    assert "SECRET" in draft["private_description"]
    assert "SECRET" not in draft["public_summary"]
    assert str(first["id"]) in draft["private_description"]
    assert len(a.get("/api/ideas").json()) == 2
    saved = a.post("/api/ideas", json=draft)
    assert saved.status_code == 201, saved.text
    assert len(a.get("/api/ideas").json()) == 3
    assert (
        a.get("/api/ideas/" + str(first["id"])).json()["private_description"]
        == first["private_description"]
    )
    assert (
        b.get("/api/ideas/" + str(saved.json()["id"])).json()["title"]
        == "Private Agriculture idea"
    )


def test_merge_validation_and_ownership(clients, monkeypatch):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    a, b, c, factory = clients
    own = idea(a)
    other = idea(b)
    for ids in (
        [own["id"]],
        [own["id"], own["id"]],
        [own["id"], True],
        list(range(1, 7)),
    ):
        assert a.post("/api/merge/preview", json={"idea_ids": ids}).status_code == 422
    assert (
        a.post(
            "/api/merge/preview", json={"idea_ids": [own["id"], other["id"]]}
        ).status_code
        == 403
    )
    # Even accepted collaborators cannot republish another person's confidential idea.
    r = a.post(
        "/api/requests",
        json={
            "source_idea_id": own["id"],
            "target_idea_id": other["id"],
            "consent": True,
        },
    ).json()
    b.patch("/api/requests/" + str(r["id"]), json={"action": "accept", "consent": True})
    assert (
        a.post(
            "/api/merge/preview", json={"idea_ids": [own["id"], other["id"]]}
        ).status_code
        == 403
    )
    second = idea(a)
    a.patch("/api/ideas/" + str(second["id"]), json={"archived": True})
    assert (
        a.post(
            "/api/merge/preview", json={"idea_ids": [own["id"], second["id"]]}
        ).status_code
        == 409
    )
    assert (
        a.post("/api/merge/preview", json={"idea_ids": [own["id"], 99999]}).status_code
        == 404
    )


def test_merge_external_payload_excludes_private_content_and_preserves_metadata(
    clients, monkeypatch
):
    import httpx
    import json
    import app.merging as merging

    a, b, c, factory = clients
    first = idea(a, "hidden")
    second = idea(a, "summary")
    captured = {}

    class MockClient:
        def __init__(self, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, url, **kwargs):
            captured.update(kwargs["json"])
            return httpx.Response(
                200,
                request=httpx.Request("POST", url),
                json={
                    "content": [
                        {
                            "text": json.dumps(
                                {
                                    "title": "A unified crop intelligence platform",
                                    "public_summary": "A connected platform for plant health monitoring and accessible grower guidance.",
                                    "rationale": "Brings related grower needs into one coherent project.",
                                    "privacy": "summary_technologies",
                                    "technologies": ["UnrequestedTool"],
                                }
                            )
                        }
                    ]
                },
            )

    monkeypatch.setenv("ANTHROPIC_API_KEY", "unit-test-key")
    monkeypatch.setattr(merging.httpx, "AsyncClient", MockClient)
    r = a.post("/api/merge/preview", json={"idea_ids": [first["id"], second["id"]]})
    assert r.status_code == 200, r.text
    assert "SECRET" not in json.dumps(captured)
    assert "private_description" not in json.dumps(captured)
    assert r.json()["provider"] == "Claude"
    assert r.json()["draft"]["privacy"] == "hidden"
    assert r.json()["draft"]["technologies"] == ["Python", "React"]


def test_merge_invalid_ai_response_falls_back_without_losing_fields(
    clients, monkeypatch
):
    import httpx
    import app.merging as merging

    a, b, c, factory = clients
    first = idea(a)
    second = idea(a)

    class MockClient:
        def __init__(self, **kwargs):
            pass

        async def __aenter__(self):
            return self

        async def __aexit__(self, *args):
            pass

        async def post(self, url, **kwargs):
            return httpx.Response(
                200,
                request=httpx.Request("POST", url),
                json={"content": [{"text": "invalid json"}]},
            )

    monkeypatch.setenv("ANTHROPIC_API_KEY", "unit-test-key")
    monkeypatch.setattr(merging.httpx, "AsyncClient", MockClient)
    r = a.post("/api/merge/preview", json={"idea_ids": [first["id"], second["id"]]})
    assert r.status_code == 200, r.text
    assert r.json()["provider"] == "local structured merge"
    assert any("unavailable" in warning for warning in r.json()["warnings"])
    assert "SECRET" in r.json()["draft"]["private_description"]


def test_model_failure_is_recoverable_without_creating_an_idea(clients, monkeypatch):
    import app.main as main

    a, b, c, factory = clients

    def unavailable(*args):
        raise OSError("Model cache unavailable")

    monkeypatch.setattr(main, "embed", unavailable)
    r = a.post(
        "/api/ideas",
        json={
            "title": "A valid draft",
            "category": "Agriculture",
            "public_summary": "A valid public abstract describing a crop-health project.",
            "private_description": "A valid private implementation plan that must not be partially saved.",
            "privacy": "summary",
            "required_skills": [],
            "technologies": [],
        },
    )
    assert r.status_code == 503, r.text
    assert "semantic model" in r.json()["detail"]
    assert a.get("/api/ideas").json() == []


def test_merge_rejects_oversized_private_records_without_truncation(
    clients, monkeypatch
):
    monkeypatch.delenv("ANTHROPIC_API_KEY", raising=False)
    a, b, c, factory = clients
    first = idea(a)
    second = idea(a)
    with factory.begin() as db:
        db.get(Idea, first["id"]).private_description = "A" * 12000
        db.get(Idea, second["id"]).private_description = "B" * 12000
    r = a.post("/api/merge/preview", json={"idea_ids": [first["id"], second["id"]]})
    assert r.status_code == 422, r.text
    assert "20,000" in r.json()["detail"]
    assert len(a.get("/api/ideas").json()) == 2


def test_browser_cookie_login_on_the_single_backend_origin(clients):
    a, b, c, factory = clients
    response = a.post(
        "/api/auth/login",
        headers={"Origin": "http://127.0.0.1:8000"},
        json={"email": "alice@example.com", "password": "StrongPassword!"},
    )
    assert response.status_code == 200, response.text
    assert "HttpOnly" in response.headers["set-cookie"]
    assert a.get("/api/auth/me").json()["email"] == "alice@example.com"
