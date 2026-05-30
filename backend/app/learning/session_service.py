import json
import uuid

from fastapi import HTTPException

from ..db import get_db
from .schemas import LearningNode, LearningWorkflowState, ProjectGoal


def _json_dumps(value: object) -> str:
    return json.dumps(value, ensure_ascii=False)


def _json_loads(value: str) -> object:
    return json.loads(value)


async def ensure_conversation(conversation_id: str | None) -> str:
    db = get_db()
    if conversation_id:
        rows = await db.execute_fetchall(
            "SELECT id FROM conversations WHERE id = ?",
            (conversation_id,),
        )
        if not rows:
            raise HTTPException(status_code=404, detail="Conversation not found")
        return conversation_id

    new_conversation_id = str(uuid.uuid4())
    await db.execute("INSERT INTO conversations (id) VALUES (?)", (new_conversation_id,))
    await db.commit()
    return new_conversation_id


async def save_goal(goal: ProjectGoal) -> None:
    db = get_db()
    await db.execute(
        """
        INSERT INTO pbl_goals (
            id, conversation_id, raw_input, title, domains_json, artifact_type, difficulty, constraints_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            goal.id,
            goal.conversation_id,
            goal.raw_input,
            goal.title,
            _json_dumps(goal.domains),
            goal.artifact_type,
            goal.difficulty,
            _json_dumps(goal.constraints),
        ),
    )
    await db.commit()


async def save_nodes(goal_id: str, nodes: list[LearningNode]) -> None:
    db = get_db()
    await db.execute("DELETE FROM pbl_nodes WHERE goal_id = ?", (goal_id,))
    for node in nodes:
        await db.execute(
            """
            INSERT INTO pbl_nodes (
                id, goal_id, parent_id, title, description, children_json, prerequisites_json,
                mastery_criteria_json, estimated_difficulty, status, component_hints_json, project_relevance
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                node.id,
                node.goal_id,
                node.parent_id,
                node.title,
                node.description,
                _json_dumps(node.children),
                _json_dumps(node.prerequisites),
                _json_dumps(node.mastery_criteria),
                node.estimated_difficulty,
                node.status,
                _json_dumps(node.component_hints),
                node.project_relevance,
            ),
        )
    await db.commit()


async def save_workflow_state(state: LearningWorkflowState) -> None:
    db = get_db()
    await db.execute(
        """
        INSERT INTO pbl_workflow_states (
            conversation_id, goal_id, current_node_id, current_mode,
            mastered_node_ids_json, weak_node_ids_json, skipped_node_ids_json, project_milestones_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(conversation_id) DO UPDATE SET
            goal_id = excluded.goal_id,
            current_node_id = excluded.current_node_id,
            current_mode = excluded.current_mode,
            mastered_node_ids_json = excluded.mastered_node_ids_json,
            weak_node_ids_json = excluded.weak_node_ids_json,
            skipped_node_ids_json = excluded.skipped_node_ids_json,
            project_milestones_json = excluded.project_milestones_json,
            updated_at = datetime('now')
        """,
        (
            state.conversation_id,
            state.goal.id,
            state.current_node_id,
            state.current_mode,
            _json_dumps(state.mastered_node_ids),
            _json_dumps(state.weak_node_ids),
            _json_dumps(state.skipped_node_ids),
            _json_dumps(state.project_milestones),
        ),
    )
    await db.commit()


async def record_event(
    conversation_id: str,
    event_type: str,
    goal_id: str | None = None,
    node_id: str | None = None,
    payload: dict | None = None,
) -> None:
    db = get_db()
    await db.execute(
        """
        INSERT INTO pbl_events (id, conversation_id, goal_id, node_id, event_type, payload_json)
        VALUES (?, ?, ?, ?, ?, ?)
        """,
        (
            str(uuid.uuid4()),
            conversation_id,
            goal_id,
            node_id,
            event_type,
            _json_dumps(payload or {}),
        ),
    )
    await db.commit()


async def update_node_status(node_id: str, status: str) -> None:
    db = get_db()
    await db.execute(
        "UPDATE pbl_nodes SET status = ?, updated_at = datetime('now') WHERE id = ?",
        (status, node_id),
    )
    await db.commit()


async def get_goal_by_id(goal_id: str) -> ProjectGoal:
    db = get_db()
    rows = await db.execute_fetchall("SELECT * FROM pbl_goals WHERE id = ?", (goal_id,))
    if not rows:
        raise HTTPException(status_code=404, detail="Goal not found")
    row = dict(rows[0])
    return ProjectGoal(
        id=row["id"],
        conversation_id=row["conversation_id"],
        raw_input=row["raw_input"],
        title=row["title"],
        domains=list(_json_loads(row["domains_json"])),
        artifact_type=row["artifact_type"],
        difficulty=row["difficulty"],
        constraints=dict(_json_loads(row["constraints_json"])),
    )


async def get_nodes_by_goal(goal_id: str) -> list[LearningNode]:
    db = get_db()
    rows = await db.execute_fetchall(
        "SELECT * FROM pbl_nodes WHERE goal_id = ? ORDER BY created_at ASC",
        (goal_id,),
    )
    return [_row_to_node(dict(row)) for row in rows]


async def get_node_by_id(node_id: str) -> LearningNode | None:
    """根据节点 ID 获取节点"""
    db = get_db()
    rows = await db.execute_fetchall(
        "SELECT * FROM pbl_nodes WHERE id = ?",
        (node_id,),
    )
    if not rows:
        return None
    return _row_to_node(dict(rows[0]))


async def get_workflow_state(conversation_id: str) -> LearningWorkflowState:
    db = get_db()
    rows = await db.execute_fetchall(
        "SELECT * FROM pbl_workflow_states WHERE conversation_id = ?",
        (conversation_id,),
    )
    if not rows:
        raise HTTPException(status_code=404, detail="PBL workflow state not found")

    state_row = dict(rows[0])
    goal = await get_goal_by_id(state_row["goal_id"])
    nodes = await get_nodes_by_goal(goal.id)
    return LearningWorkflowState(
        conversation_id=conversation_id,
        goal=goal,
        knowledge_tree=nodes,
        current_node_id=state_row["current_node_id"],
        current_mode=state_row["current_mode"],
        mastered_node_ids=list(_json_loads(state_row["mastered_node_ids_json"])),
        weak_node_ids=list(_json_loads(state_row["weak_node_ids_json"])),
        skipped_node_ids=list(_json_loads(state_row["skipped_node_ids_json"])),
        project_milestones=list(_json_loads(state_row["project_milestones_json"])),
    )


def _row_to_node(row: dict) -> LearningNode:
    return LearningNode(
        id=row["id"],
        goal_id=row["goal_id"],
        parent_id=row["parent_id"],
        title=row["title"],
        description=row["description"],
        children=list(_json_loads(row["children_json"])),
        prerequisites=list(_json_loads(row["prerequisites_json"])),
        mastery_criteria=list(_json_loads(row["mastery_criteria_json"])),
        estimated_difficulty=row["estimated_difficulty"],
        status=row["status"],
        component_hints=list(_json_loads(row["component_hints_json"])),
        project_relevance=row["project_relevance"],
    )
