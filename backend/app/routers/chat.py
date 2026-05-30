import json
from typing import AsyncIterator

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, field_validator

from ..db import get_db
from ..orchestrator.prompt_builder import build_system_prompt, get_plugin_capabilities_for_user
from ..services.llm import stream_chat, generate_title
from ..services.streaming import llm_event_stream

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

async def _post_persist_title_event(
    conversation_id: str,
    user_content: str,
    full_response: str,
) -> list[str]:
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
                return [f"data: {json.dumps({'type': 'title', 'content': title}, ensure_ascii=False)}\n\n"]
        except Exception:
            return []
    return []


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
        llm_event_stream(
            messages,
            stream_chat,
            request.conversation_id,
            user_content,
            persist=True,
            post_persist_hook=_post_persist_title_event,
        ),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )
