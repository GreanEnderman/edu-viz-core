import json
import uuid
from typing import AsyncIterator, Awaitable, Callable

from ..db import get_db
from ..orchestrator.a2ui_builder import is_a2ui_line, parse_a2ui_line, to_sse_event


def emit_line(line: str) -> str:
    """Convert a complete output line to an SSE event string."""
    if is_a2ui_line(line):
        return to_sse_event(parse_a2ui_line(line))
    return f"data: {json.dumps({'type': 'text', 'content': line + '\n'}, ensure_ascii=False)}\n\n"


async def persist_messages(
    conversation_id: str,
    user_content: str,
    assistant_content: str,
    node_id: str | None = None,
) -> None:
    db = get_db()
    await db.executemany(
        "INSERT INTO messages (id, conversation_id, role, type, content, node_id) VALUES (?, ?, ?, 'text', ?, ?)",
        [
            (str(uuid.uuid4()), conversation_id, "user", user_content, node_id),
            (str(uuid.uuid4()), conversation_id, "assistant", assistant_content, node_id),
        ],
    )
    await db.execute(
        "UPDATE conversations SET updated_at = datetime('now') WHERE id = ?",
        (conversation_id,),
    )
    await db.commit()


async def llm_event_stream(
    messages: list[dict],
    stream_fn: Callable[[list[dict]], AsyncIterator[str]],
    conversation_id: str | None,
    user_content: str,
    persist: bool = True,
    node_id: str | None = None,
    post_persist_hook: Callable[[str, str, str], Awaitable[list[str]]] | None = None,
) -> AsyncIterator[str]:
    try:
        buf = ""
        full_response = ""
        async for chunk in stream_fn(messages):
            buf += chunk
            full_response += chunk
            lines = buf.split("\n")
            buf = lines[-1]
            for line in lines[:-1]:
                yield emit_line(line)
        if buf:
            yield emit_line(buf)

        if conversation_id and persist:
            await persist_messages(conversation_id, user_content, full_response, node_id)
            if post_persist_hook:
                for event in await post_persist_hook(conversation_id, user_content, full_response):
                    yield event

        yield f"data: {json.dumps({'type': 'done'})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"
