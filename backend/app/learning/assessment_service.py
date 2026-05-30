import json
import uuid
from datetime import datetime

from ..db import get_db
from .schemas import Assessment, AssessmentAttempt, AssessmentQuestion


def _json_dumps(value: object) -> str:
    """序列化为 JSON 字符串"""
    return json.dumps(value, ensure_ascii=False)


def _json_loads(value: str) -> object:
    """从 JSON 字符串反序列化"""
    return json.loads(value)


async def save_assessment(assessment: Assessment) -> None:
    """保存测评到数据库"""
    db = get_db()
    questions_json = _json_dumps([q.model_dump() for q in assessment.questions])

    await db.execute(
        """
        INSERT INTO pbl_assessments (id, node_id, goal_id, questions_json, created_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (
            assessment.id,
            assessment.node_id,
            assessment.goal_id,
            questions_json,
            assessment.created_at,
        ),
    )
    await db.commit()


async def get_assessment_by_id(assessment_id: str) -> Assessment:
    """根据 ID 获取测评"""
    db = get_db()
    rows = await db.execute_fetchall(
        "SELECT * FROM pbl_assessments WHERE id = ?", (assessment_id,)
    )
    row = rows[0] if rows else None

    if not row:
        raise ValueError(f"Assessment not found: {assessment_id}")

    questions_data = _json_loads(row["questions_json"])
    questions = [AssessmentQuestion(**q) for q in questions_data]

    return Assessment(
        id=row["id"],
        node_id=row["node_id"],
        goal_id=row["goal_id"],
        questions=questions,
        created_at=row["created_at"],
    )


async def save_assessment_attempt(attempt: AssessmentAttempt) -> None:
    """保存测评尝试到数据库"""
    db = get_db()

    await db.execute(
        """
        INSERT INTO pbl_assessment_attempts (
            id, assessment_id, conversation_id, node_id,
            user_answers_json, status, score, reasoning,
            weak_points_json, suggestions_json, created_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            attempt.id,
            attempt.assessment_id,
            attempt.conversation_id,
            attempt.node_id,
            _json_dumps(attempt.user_answers),
            attempt.status,
            attempt.score,
            attempt.reasoning,
            _json_dumps(attempt.weak_points),
            _json_dumps(attempt.suggestions),
            attempt.created_at,
        ),
    )
    await db.commit()


async def get_latest_attempt(
    node_id: str, conversation_id: str
) -> AssessmentAttempt | None:
    """获取节点的最新测评尝试"""
    db = get_db()
    rows = await db.execute_fetchall(
        """
        SELECT * FROM pbl_assessment_attempts
        WHERE node_id = ? AND conversation_id = ?
        ORDER BY created_at DESC
        LIMIT 1
        """,
        (node_id, conversation_id),
    )
    row = rows[0] if rows else None

    if not row:
        return None

    return AssessmentAttempt(
        id=row["id"],
        assessment_id=row["assessment_id"],
        conversation_id=row["conversation_id"],
        node_id=row["node_id"],
        user_answers=_json_loads(row["user_answers_json"]),
        status=row["status"],
        score=row["score"],
        reasoning=row["reasoning"],
        weak_points=_json_loads(row["weak_points_json"]),
        suggestions=_json_loads(row["suggestions_json"]),
        created_at=row["created_at"],
    )


async def get_assessment_by_node_id(node_id: str) -> Assessment | None:
    """根据节点 ID 获取最新的测评"""
    db = get_db()
    rows = await db.execute_fetchall(
        """
        SELECT * FROM pbl_assessments
        WHERE node_id = ?
        ORDER BY created_at DESC
        LIMIT 1
        """,
        (node_id,),
    )
    row = rows[0] if rows else None

    if not row:
        return None

    questions_data = _json_loads(row["questions_json"])
    questions = [AssessmentQuestion(**q) for q in questions_data]

    return Assessment(
        id=row["id"],
        node_id=row["node_id"],
        goal_id=row["goal_id"],
        questions=questions,
        created_at=row["created_at"],
    )
