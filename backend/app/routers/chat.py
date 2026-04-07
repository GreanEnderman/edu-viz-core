import json
import uuid
from typing import AsyncIterator

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator

from backend.app.db import get_db
from backend.app.orchestrator.a2ui_builder import is_a2ui_line, parse_a2ui_line, to_sse_event
from backend.app.orchestrator.prompt_builder import build_system_prompt, get_plugin_capabilities_for_user
from backend.app.services.llm import stream_chat, generate_title

router = APIRouter()


class Message(BaseModel):
    role: str
    content: str


class ChatRequest(BaseModel):
    messages: list[Message]
    conversation_id: str | None = None

    @field_validator("messages")
    @classmethod
    def messages_not_empty(cls, v: list[Message]) -> list[Message]:
        if not v:
            raise ValueError("messages must not be empty")
        return v


def _emit_line(line: str) -> str:
    """Convert a complete output line to an SSE event string."""
    if is_a2ui_line(line):
        return to_sse_event(parse_a2ui_line(line))
    # split("\n") 丢失了换行符，需要还原以保持 markdown 格式
    return f"data: {json.dumps({'type': 'text', 'content': line + '\n'}, ensure_ascii=False)}\n\n"


async def _persist_messages(
    conversation_id: str,
    user_content: str,
    assistant_content: str,
) -> None:
    db = get_db()
    await db.executemany(
        "INSERT INTO messages (id, conversation_id, role, type, content) VALUES (?, ?, ?, 'text', ?)",
        [
            (str(uuid.uuid4()), conversation_id, "user", user_content),
            (str(uuid.uuid4()), conversation_id, "assistant", assistant_content),
        ],
    )
    await db.execute(
        "UPDATE conversations SET updated_at = datetime('now') WHERE id = ?",
        (conversation_id,),
    )
    await db.commit()


async def _event_stream(
    messages: list[dict],
    conversation_id: str | None,
    user_content: str,
) -> AsyncIterator[str]:
    try:
        buf = ""
        full_response = ""
        async for chunk in stream_chat(messages):
            buf += chunk
            full_response += chunk
            lines = buf.split("\n")
            buf = lines[-1]  # keep incomplete trailing segment
            for line in lines[:-1]:
                yield _emit_line(line)
        # flush remaining buffer
        if buf:
            yield _emit_line(buf)

        # persist messages if conversation_id is provided
        if conversation_id:
            await _persist_messages(conversation_id, user_content, full_response)

            # 首次回复后生成标题
            db = get_db()
            row = await db.execute_fetchall(
                "SELECT COUNT(*) as cnt FROM messages WHERE conversation_id = ? AND role = 'assistant'",
                (conversation_id,),
            )
            if row and dict(row[0])["cnt"] == 1:
                try:
                    title = await generate_title(user_content, full_response)
                    if title:
                        await db.execute(
                            "UPDATE conversations SET title = ? WHERE id = ?",
                            (title, conversation_id),
                        )
                        await db.commit()
                        yield f"data: {json.dumps({'type': 'title', 'content': title}, ensure_ascii=False)}\n\n"
                except Exception:
                    pass  # 标题生成失败不影响主流程

        yield f"data: {json.dumps({'type': 'done'})}\n\n"
    except Exception as e:
        yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"


@router.post("/chat")
async def chat(request: ChatRequest) -> StreamingResponse:
    # validate conversation_id if provided
    if request.conversation_id:
        db = get_db()
        conv = await db.execute_fetchall(
            "SELECT id FROM conversations WHERE id = ?",
            (request.conversation_id,),
        )
        if not conv:
            raise HTTPException(status_code=404, detail="Conversation not found")

    messages = [{"role": m.role, "content": m.content} for m in request.messages]
    plugin_caps = await get_plugin_capabilities_for_user("default")
    system_prompt = build_system_prompt(plugin_capabilities=plugin_caps)
    messages = [{"role": "system", "content": system_prompt}] + messages

    # user content is the last user message for persistence
    user_content = request.messages[-1].content

    return StreamingResponse(
        _event_stream(messages, request.conversation_id, user_content),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
