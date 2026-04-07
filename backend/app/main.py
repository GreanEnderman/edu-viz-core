from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from backend.app.core.config import settings
from backend.app.db import init_db
from backend.app.plugins_manager.loader import load_plugins
from backend.app.plugins_manager.registry import PluginRegistry
from backend.app.routers import chat, conversations
from backend.app.routers import plugins as plugins_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_db()
    plugins = load_plugins(settings.PLUGINS_DIR)
    PluginRegistry.get_instance().load_all(plugins)
    yield
    # cleanup: close db connection
    from backend.app.db import get_db
    db = get_db()
    await db.close()


app = FastAPI(title="AhaTutor API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins_list(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/v1")
app.include_router(conversations.router, prefix="/api/v1")
app.include_router(plugins_router.router, prefix="/api/v1")

import os
if os.path.exists(settings.PLUGINS_DIR):
    app.mount("/plugins", StaticFiles(directory=settings.PLUGINS_DIR), name="plugins")


@app.get("/health")
async def health() -> dict:
    return {"status": "ok"}
