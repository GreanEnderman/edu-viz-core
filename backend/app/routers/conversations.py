import uuid

from fastapi import APIRouter, HTTPException, Query

from ..db import get_db
from ..models.conversation import ConversationResponse, MessageResponse

router = APIRouter(prefix="/conversations", tags=["conversations"])


@router.post("", status_code=201, response_model=ConversationResponse)
async def create_conversation() -> ConversationResponse:
    db = get_db()
    id = str(uuid.uuid4())
    await db.execute(
        "INSERT INTO conversations (id) VALUES (?)",
        (id,),
    )
    await db.commit()
    row = await db.execute_fetchall(
        "SELECT id, title, created_at, updated_at FROM conversations WHERE id = ?",
        (id,),
    )
    return ConversationResponse(**dict(row[0]))


@router.get("", response_model=list[ConversationResponse])
async def list_conversations() -> list[ConversationResponse]:
    db = get_db()
    rows = await db.execute_fetchall(
        "SELECT id, title, created_at, updated_at FROM conversations ORDER BY updated_at DESC"
    )
    return [ConversationResponse(**dict(r)) for r in rows]


@router.get("/{conversation_id}/messages", response_model=list[MessageResponse])
async def get_messages(conversation_id: str) -> list[MessageResponse]:
    db = get_db()
    # 验证对话存在
    conv = await db.execute_fetchall(
        "SELECT id FROM conversations WHERE id = ?",
        (conversation_id,),
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    rows = await db.execute_fetchall(
        "SELECT id, role, type, content, created_at FROM messages WHERE conversation_id = ? ORDER BY created_at ASC",
        (conversation_id,),
    )
    return [MessageResponse(**dict(r)) for r in rows]


@router.delete("/{conversation_id}", status_code=204)
async def delete_conversation(conversation_id: str) -> None:
    db = get_db()
    conv = await db.execute_fetchall(
        "SELECT id FROM conversations WHERE id = ?",
        (conversation_id,),
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    await db.execute("DELETE FROM conversations WHERE id = ?", (conversation_id,))
    await db.commit()


@router.get("/{conversation_id}/messages/by-node/{node_id}", response_model=list[MessageResponse])
async def get_messages_by_node(
    conversation_id: str,
    node_id: str,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
) -> list[MessageResponse]:
    """按节点查询消息历史"""
    db = get_db()

    # 验证对话存在
    conv = await db.execute_fetchall(
        "SELECT id FROM conversations WHERE id = ?",
        (conversation_id,),
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    rows = await db.execute_fetchall(
        """
        SELECT id, role, type, content, created_at
        FROM messages
        WHERE conversation_id = ? AND node_id = ?
        ORDER BY created_at ASC
        LIMIT ? OFFSET ?
        """,
        (conversation_id, node_id, limit, offset),
    )
    return [MessageResponse(**dict(r)) for r in rows]


@router.get("/{conversation_id}/messages/stats")
async def get_message_stats_by_node(conversation_id: str) -> dict:
    """获取每个节点的消息数量统计"""
    db = get_db()

    # 验证对话存在
    conv = await db.execute_fetchall(
        "SELECT id FROM conversations WHERE id = ?",
        (conversation_id,),
    )
    if not conv:
        raise HTTPException(status_code=404, detail="Conversation not found")

    rows = await db.execute_fetchall(
        """
        SELECT node_id, COUNT(*) as count
        FROM messages
        WHERE conversation_id = ? AND node_id IS NOT NULL
        GROUP BY node_id
        """,
        (conversation_id,),
    )
    return {row["node_id"]: row["count"] for row in rows}
