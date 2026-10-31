"""Serve the built React application and API from a single host."""

from pathlib import Path
from fastapi import HTTPException
from starlette.responses import FileResponse
from starlette.staticfiles import StaticFiles
from starlette.exceptions import HTTPException as StarletteHTTPException


class FrontendFiles(StaticFiles):
    async def __call__(self, scope, receive, send):
        if scope["type"] == "websocket":
            await send({"type": "websocket.close", "code": 1008})
            return
        await super().__call__(scope, receive, send)

    async def get_response(self, path, scope):
        normalized = path.replace("\\", "/").lstrip("/")
        if normalized == ".":
            normalized = ""
        if any(part.startswith(".") for part in normalized.split("/") if part):
            raise HTTPException(404, "File not found")
        # An unknown API or asset must remain a real 404, never a successful
        # HTML response that the login client could mistake for JSON.
        if normalized == "api" or normalized.startswith(("api/", "ws/")):
            raise HTTPException(404, "API route not found")
        try:
            return await super().get_response(path, scope)
        except StarletteHTTPException as error:
            if error.status_code != 404:
                raise
        if normalized.startswith("assets/") or Path(normalized).suffix:
            raise HTTPException(404, "File not found")
        return FileResponse(
            Path(self.directory) / "index.html", headers={"Cache-Control": "no-store"}
        )


def install_frontend(app, directory):
    directory = Path(directory).resolve()
    if not (directory / "index.html").is_file():
        return False
    app.mount("/", FrontendFiles(directory=str(directory), html=True), name="frontend")
    return True
