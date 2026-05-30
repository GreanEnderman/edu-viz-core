import aiosqlite

from .core.config import settings

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
    node_id         TEXT,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_messages_node_id ON messages(node_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_node ON messages(conversation_id, node_id);

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

_PBL_SQL = """
CREATE TABLE IF NOT EXISTS pbl_goals (
    id              TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    raw_input       TEXT NOT NULL,
    title           TEXT NOT NULL,
    domains_json    TEXT NOT NULL DEFAULT '[]',
    artifact_type   TEXT NOT NULL,
    difficulty      TEXT NOT NULL,
    constraints_json TEXT NOT NULL DEFAULT '{}',
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pbl_nodes (
    id                    TEXT PRIMARY KEY,
    goal_id               TEXT NOT NULL REFERENCES pbl_goals(id) ON DELETE CASCADE,
    parent_id             TEXT REFERENCES pbl_nodes(id) ON DELETE CASCADE,
    title                 TEXT NOT NULL,
    description           TEXT NOT NULL,
    children_json         TEXT NOT NULL DEFAULT '[]',
    prerequisites_json    TEXT NOT NULL DEFAULT '[]',
    mastery_criteria_json TEXT NOT NULL DEFAULT '[]',
    estimated_difficulty  TEXT NOT NULL,
    status                TEXT NOT NULL,
    component_hints_json  TEXT NOT NULL DEFAULT '[]',
    project_relevance     TEXT NOT NULL,
    created_at            TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at            TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pbl_workflow_states (
    conversation_id        TEXT PRIMARY KEY REFERENCES conversations(id) ON DELETE CASCADE,
    goal_id                TEXT NOT NULL REFERENCES pbl_goals(id) ON DELETE CASCADE,
    current_node_id        TEXT REFERENCES pbl_nodes(id) ON DELETE SET NULL,
    current_mode           TEXT NOT NULL,
    mastered_node_ids_json TEXT NOT NULL DEFAULT '[]',
    weak_node_ids_json     TEXT NOT NULL DEFAULT '[]',
    skipped_node_ids_json  TEXT NOT NULL DEFAULT '[]',
    project_milestones_json TEXT NOT NULL DEFAULT '[]',
    created_at             TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at             TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pbl_events (
    id              TEXT PRIMARY KEY,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    goal_id         TEXT REFERENCES pbl_goals(id) ON DELETE CASCADE,
    node_id         TEXT REFERENCES pbl_nodes(id) ON DELETE CASCADE,
    event_type      TEXT NOT NULL,
    payload_json    TEXT NOT NULL DEFAULT '{}',
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS pbl_assessments (
    id              TEXT PRIMARY KEY,
    node_id         TEXT NOT NULL REFERENCES pbl_nodes(id) ON DELETE CASCADE,
    goal_id         TEXT NOT NULL REFERENCES pbl_goals(id) ON DELETE CASCADE,
    questions_json  TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pbl_assessments_node_id ON pbl_assessments(node_id);
CREATE INDEX IF NOT EXISTS idx_pbl_assessments_goal_id ON pbl_assessments(goal_id);

CREATE TABLE IF NOT EXISTS pbl_assessment_attempts (
    id              TEXT PRIMARY KEY,
    assessment_id   TEXT NOT NULL REFERENCES pbl_assessments(id) ON DELETE CASCADE,
    conversation_id TEXT NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    node_id         TEXT NOT NULL REFERENCES pbl_nodes(id) ON DELETE CASCADE,
    user_answers_json TEXT NOT NULL,
    status          TEXT NOT NULL,
    score           REAL NOT NULL,
    reasoning       TEXT NOT NULL,
    weak_points_json TEXT NOT NULL,
    suggestions_json TEXT NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_pbl_assessment_attempts_conversation_id
    ON pbl_assessment_attempts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_pbl_assessment_attempts_node_id
    ON pbl_assessment_attempts(node_id);

-- 新增索引：优化项目列表和消息统计查询
CREATE INDEX IF NOT EXISTS idx_pbl_goals_updated_at
    ON pbl_goals(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_node_created
    ON messages(node_id, created_at);
"""

_AGENT_LOGS_SQL = """
CREATE TABLE IF NOT EXISTS agent_logs (
    id              TEXT PRIMARY KEY,
    agent_name      TEXT NOT NULL,
    input_data      TEXT NOT NULL,
    output_data     TEXT,
    success         INTEGER NOT NULL,
    error_message   TEXT,
    elapsed_seconds REAL NOT NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_agent_logs_agent_name ON agent_logs(agent_name);
CREATE INDEX IF NOT EXISTS idx_agent_logs_created_at ON agent_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_agent_logs_success ON agent_logs(success);
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
    await _db.executescript(_PBL_SQL)
    await _db.executescript(_AGENT_LOGS_SQL)
    await _db.commit()


def get_db() -> aiosqlite.Connection:
    assert _db is not None, "Database not initialized. Call init_db() first."
    return _db


async def close_db() -> None:
    global _db
    if _db is not None:
        await _db.close()
        _db = None
