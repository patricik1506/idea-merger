import base64
import hashlib
import json
import os
from pathlib import Path
import secrets
import time
from datetime import datetime, timedelta, timezone
import bcrypt
from cryptography.fernet import Fernet
from fastapi import Depends, HTTPException, Request
import jwt
from sqlalchemy.orm import Session
from fastapi.security import HTTPBearer

bearer = HTTPBearer(auto_error=False)
from .models import SessionLocal, User, RateLimit

PRODUCTION = os.getenv("APP_ENV", "development") == "production"
ORIGINS = [
    x.strip()
    for x in os.getenv(
        "CORS_ORIGINS",
        "http://127.0.0.1:5173,http://localhost:5173,http://127.0.0.1:4173,http://localhost:4173",
    ).split(",")
]
# Render supplies this trusted service URL. Allow it without guessing the
# assigned hostname; custom domains still use the explicit CORS_ORIGINS setting.
render_origin = os.getenv("RENDER_EXTERNAL_URL", "").rstrip("/")
if render_origin and render_origin not in ORIGINS:
    ORIGINS.append(render_origin)
if not PRODUCTION:
    for origin in ("http://127.0.0.1:8000", "http://localhost:8000"):
        if origin not in ORIGINS:
            ORIGINS.append(origin)
if PRODUCTION and (not os.getenv("JWT_SECRET") or not os.getenv("CHAT_ENCRYPTION_KEY")):
    raise RuntimeError("Production requires JWT_SECRET and CHAT_ENCRYPTION_KEY")
state_dir = Path(os.getenv("LOCAL_STATE_DIR", "."))
state_dir.mkdir(parents=True, exist_ok=True)
secret_file = state_dir / ".local-secrets.json"
local = {}
if not PRODUCTION:
    if secret_file.exists():
        local = json.loads(secret_file.read_text())
    else:
        local = {
            "jwt": secrets.token_urlsafe(48),
            "chat": Fernet.generate_key().decode(),
        }
        secret_file.write_text(json.dumps(local))
SECRET = os.getenv("JWT_SECRET") or local["jwt"]
CIPHER = Fernet((os.getenv("CHAT_ENCRYPTION_KEY") or local["chat"]).encode())


def get_db():
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def hash_password(password):
    if len(password.encode()) > 72:
        raise HTTPException(422, "Password must be at most 72 UTF-8 bytes")
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(password, hashed):
    try:
        return bcrypt.checkpw(password.encode(), hashed.encode())
    except ValueError:
        return False


def token(user):
    return jwt.encode(
        {
            "sub": str(user.id),
            "ver": user.token_version,
            "exp": datetime.now(timezone.utc) + timedelta(hours=8),
        },
        SECRET,
        algorithm="HS256",
    )


def from_token(raw, db):
    try:
        data = jwt.decode(raw, SECRET, algorithms=["HS256"])
        user = db.get(User, int(data["sub"]))
        if not user or user.suspended or user.token_version != data["ver"]:
            raise ValueError()
        return user
    except (jwt.PyJWTError, ValueError, KeyError, TypeError):
        raise HTTPException(401, "Please sign in again")


def current(
    request: Request, db: Session = Depends(get_db), credentials=Depends(bearer)
):
    auth = request.headers.get("authorization", "")
    raw = (
        auth[7:]
        if auth.startswith("Bearer ")
        else request.cookies.get("aim_session", "")
    )
    return from_token(raw, db)


def admin(user=Depends(current)):
    if user.role != "admin":
        raise HTTPException(403, "Administrator access required")
    return user


def limited(db, key, maximum=8, seconds=900):
    digest = hashlib.sha256(key.encode()).hexdigest()
    row = db.get(RateLimit, digest)
    clock = int(time.time())
    if not row:
        row = RateLimit(key=digest, count=0, reset_at=clock + seconds)
        db.add(row)
    if row.reset_at < clock:
        row.count, row.reset_at = 0, clock + seconds
    row.count += 1
    db.commit()
    if row.count > maximum:
        raise HTTPException(429, "Too many attempts. Please try again later.")
