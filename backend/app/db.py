import aiosqlite

from backend.app.core.config import settings

_db: aiosqlite.Connection | None = None

_INIT_SQL = """
CREATE TABLE IF NOT EXISTS conversations (
    id          TEXT PRIMARY KEY,
    title       TEXT NOT NULL DEFAULT '新对话',
    created_at  TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS messages (
    id              TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    role            TEXT NOT NULL,
    type            TEXT NOT NULL DEFAULT 'text',
    content         TEXT NOT NULL DEFAULT '',
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

PRAGMA foreign_keys = ON;
"""

_PLUGIN_SETTINGS_SQL = """
CREATE TABLE IF NOT EXISTS plugin_user_settings (
    user_id    TEXT NOT NULL,
    plugin_id  TEXT NOT NULL,
    enabled    INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, plugin_id)
);
"""


async def init_db() -> None:
    global _db
    # 确保父目录存在
    import os
    db_path = settings.DATABASE_PATH
    os.makedirs(os.path.dirname(db_path) or ".", exist_ok=True)

    _db = await aiosqlite.connect(db_path)
    _db.row_factory = aiosqlite.Row
    await _db.executescript(_INIT_SQL)
    await _db.executescript(_PLUGIN_SETTINGS_SQL)
    await _db.commit()


def get_db() -> aiosqlite.Connection:
    assert _db is not None, "Database not initialized. Call init_db() first."
    return _db
