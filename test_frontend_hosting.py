from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.frontend_hosting import install_frontend


def test_built_frontend_deep_links_and_assets(tmp_path):
    (tmp_path / "index.html").write_text(
        '<!doctype html><div id="root">Built app</div>'
    )
    (tmp_path / "assets").mkdir()
    (tmp_path / "assets" / "app.js").write_text('console.log("asset")')
    app = FastAPI()

    @app.get("/api/health")
    def health():
        return {"status": "ok"}

    assert install_frontend(app, tmp_path)
    client = TestClient(app)
    for route in ("/", "/login", "/dashboard", "/merge", "/workspace/12"):
        response = client.get(route)
        assert response.status_code == 200, route
        assert 'id="root"' in response.text
    assert client.get("/assets/app.js").status_code == 200
    assert client.get("/api/health").json() == {"status": "ok"}


def test_unknown_api_and_asset_paths_are_not_spa_successes(tmp_path):
    (tmp_path / "index.html").write_text('<div id="root"></div>')
    app = FastAPI()
    install_frontend(app, tmp_path)
    client = TestClient(app)
    for route in (
        "/api",
        "/api/not-a-route",
        "/assets/missing.js",
        "/.env",
        "/ws/not-a-route",
    ):
        assert client.get(route).status_code == 404, route
    assert client.post("/dashboard").status_code == 405


def test_frontend_mount_is_optional_for_backend_only_development(tmp_path):
    app = FastAPI()
    assert install_frontend(app, tmp_path) is False
    assert TestClient(app).get("/login").status_code == 404
