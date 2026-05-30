from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
import uuid
import json

from ..learning.schemas import (
    PblChatRequest,
    CreateGoalRequest,
    GoalCreatedResponse,
    LearningWorkflowState,
    NodeActionRequest,
    NodeActionResponse,
    TreeResponse,
    ProjectGoal,
    GenerateAssessmentRequest,
    AssessmentResponse,
    SubmitAssessmentRequest,
    JudgmentResponse,
    Assessment,
    AssessmentAttempt,
    SwitchNodeRequest,
)
from ..learning.prompt_context import build_pbl_chat_context
from ..learning.session_service import (
    ensure_conversation,
    get_workflow_state,
    record_event,
    save_goal,
    save_nodes,
    save_workflow_state,
)
from ..learning.assessment_service import (
    save_assessment,
    get_assessment_by_id,
    save_assessment_attempt,
    get_assessment_by_node_id,
)
from ..orchestrator.prompt_builder import build_pbl_system_prompt, get_plugin_capabilities_for_user
from ..services.llm import stream_chat
from ..services.streaming import llm_event_stream
from ..agents.goal_clarifier import GoalClarifierAgent, GoalClarifierInput
from ..agents.curriculum_architect import CurriculumArchitectAgent, CurriculumArchitectInput
from ..agents.assessment_designer import AssessmentDesignerAgent, AssessmentDesignerInput
from ..agents.mastery_judge import MasteryJudgeAgent, MasteryJudgeInput
from ..workflow.orchestrator import LearningOrchestrator
from ..workflow.transitions import find_next_node_id
from ..workflow.tutor_orchestrator import TutorOrchestrator

router = APIRouter(prefix="/pbl", tags=["pbl"])


@router.get("/goals", response_model=dict)
async def list_goals() -> dict:
    """获取所有 PBL 项目列表"""
    from ..db import get_db

    db = get_db()
    rows = await db.execute_fetchall(
        """
        SELECT id, conversation_id, raw_input, title, domains_json,
               artifact_type, difficulty, created_at, updated_at
        FROM pbl_goals
        ORDER BY updated_at DESC
        """
    )

    goals = []
    for row in rows:
        goal_dict = dict(row)
        goal_dict['domains'] = json.loads(goal_dict.pop('domains_json'))
        goals.append(goal_dict)

    return {"goals": goals}


@router.get("/goals/{goal_id}/detail")
async def get_goal_detail(goal_id: str) -> dict:
    """获取项目详情，包含知识树和消息统计"""
    from ..learning.session_service import get_goal_by_id, get_nodes_by_goal, get_workflow_state
    from ..db import get_db

    db = get_db()

    # 1. 获取目标
    goal = await get_goal_by_id(goal_id)

    # 2. 获取节点
    nodes = await get_nodes_by_goal(goal_id)

    # 3. 获取工作流状态
    workflow_state = await get_workflow_state(goal.conversation_id)

    # 4. 获取消息统计
    stats_rows = await db.execute_fetchall(
        """
        SELECT
            m.node_id,
            COUNT(*) as count,
            MAX(m.created_at) as last_message_at
        FROM messages m
        JOIN pbl_nodes n ON m.node_id = n.id
        WHERE n.goal_id = ?
        GROUP BY m.node_id
        """,
        (goal_id,)
    )

    message_stats = {
        row['node_id']: {
            'count': row['count'],
            'last_message_at': row['last_message_at']
        }
        for row in stats_rows
    }

    return {
        "goal": goal.model_dump(),
        "nodes": [n.model_dump() for n in nodes],
        "workflow_state": workflow_state.model_dump(),
        "message_stats": message_stats
    }


@router.delete("/goals/{goal_id}", status_code=204)
async def delete_goal(goal_id: str) -> None:
    """删除项目及其关联的会话、节点、状态和消息。"""
    from ..learning.session_service import get_goal_by_id
    from ..db import get_db

    goal = await get_goal_by_id(goal_id)
    db = get_db()
    await db.execute("DELETE FROM conversations WHERE id = ?", (goal.conversation_id,))
    await db.commit()


@router.post("/goals", response_model=GoalCreatedResponse, status_code=201)
async def create_goal(request: CreateGoalRequest) -> GoalCreatedResponse:
    conversation_id = await ensure_conversation(request.conversation_id)

    # 使用 Agent 分析目标
    agent = GoalClarifierAgent()
    result = await agent.run(
        GoalClarifierInput(
            raw_input=request.raw_input,
            conversation_id=conversation_id,
        )
    )

    if not result.is_success:
        raise HTTPException(
            status_code=500, detail=f"Goal analysis failed: {result.error}"
        )

    # 构建 ProjectGoal
    goal = ProjectGoal(
        id=str(uuid.uuid4()),
        conversation_id=conversation_id,
        raw_input=request.raw_input,
        title=result.data.title,
        domains=result.data.domains,
        artifact_type=result.data.artifact_type,
        difficulty=result.data.difficulty,
        constraints=result.data.constraints,
    )
    await save_goal(goal)

    initial_state = LearningWorkflowState(
        conversation_id=conversation_id,
        goal=goal,
        knowledge_tree=[],
        current_node_id=None,
        current_mode="planning",
        mastered_node_ids=[],
        weak_node_ids=[],
        skipped_node_ids=[],
        project_milestones=[],
    )
    await save_workflow_state(initial_state)
    await record_event(
        conversation_id=conversation_id,
        goal_id=goal.id,
        event_type="goal_created",
        payload={"raw_input": request.raw_input},
    )
    return GoalCreatedResponse(goal=goal, workflow_state=initial_state)


@router.post("/goals/{goal_id}/tree", response_model=TreeResponse)
async def generate_goal_tree(goal_id: str) -> TreeResponse:
    from ..learning.session_service import get_goal_by_id

    goal = await get_goal_by_id(goal_id)

    # 使用 Agent 生成学习树
    agent = CurriculumArchitectAgent()
    result = await agent.run(CurriculumArchitectInput(goal=goal))

    if not result.is_success:
        raise HTTPException(
            status_code=500, detail=f"Tree generation failed: {result.error}"
        )

    nodes = result.data.nodes

    # 为每个节点生成新的 UUID，并更新引用关系
    old_to_new_id = {}
    for node in nodes:
        new_id = str(uuid.uuid4())
        old_to_new_id[node.id] = new_id
        node.id = new_id

    # 更新所有引用关系
    for node in nodes:
        if node.parent_id and node.parent_id in old_to_new_id:
            node.parent_id = old_to_new_id[node.parent_id]
        node.children = [old_to_new_id.get(child_id, child_id) for child_id in node.children]
        node.prerequisites = [old_to_new_id.get(prereq_id, prereq_id) for prereq_id in node.prerequisites]

    await save_nodes(goal_id, nodes)

    workflow_state = LearningWorkflowState(
        conversation_id=goal.conversation_id,
        goal=goal,
        knowledge_tree=nodes,
        current_node_id=find_next_node_id(nodes),
        current_mode="planning",
        mastered_node_ids=[],
        weak_node_ids=[],
        skipped_node_ids=[],
        project_milestones=[],
    )
    await save_workflow_state(workflow_state)
    await record_event(
        conversation_id=goal.conversation_id,
        goal_id=goal.id,
        event_type="tree_generated",
        payload={"node_count": len(nodes)},
    )
    return TreeResponse(goal_id=goal_id, nodes=nodes)


@router.get("/sessions/{conversation_id}/state", response_model=LearningWorkflowState)
async def get_pbl_workflow_state(conversation_id: str) -> LearningWorkflowState:
    return await get_workflow_state(conversation_id)


@router.post("/sessions/{conversation_id}/switch-node", response_model=LearningWorkflowState)
async def switch_to_node(conversation_id: str, request: SwitchNodeRequest) -> LearningWorkflowState:
    """切换到指定节点"""
    from ..learning.session_service import get_node_by_id

    # 获取当前工作流状态
    state = await get_workflow_state(conversation_id)

    # 验证节点是否存在
    node = await get_node_by_id(request.node_id)
    if not node:
        raise HTTPException(status_code=404, detail=f"Node not found: {request.node_id}")

    # 验证节点是否属于当前目标的知识树
    node_ids = [n.id for n in state.knowledge_tree]
    if request.node_id not in node_ids:
        raise HTTPException(
            status_code=400,
            detail=f"Node {request.node_id} does not belong to current goal's knowledge tree"
        )

    # 更新当前节点
    state.current_node_id = request.node_id
    await save_workflow_state(state)

    # 记录事件
    await record_event(
        conversation_id=conversation_id,
        goal_id=state.goal.id,
        node_id=request.node_id,
        event_type="node_switched",
        payload={"node_id": request.node_id, "node_title": node.title},
    )

    return state


@router.post("/nodes/{node_id}/action", response_model=NodeActionResponse)
async def apply_node_action(node_id: str, request: NodeActionRequest) -> NodeActionResponse:
    orchestrator = LearningOrchestrator()
    state, integration_feedback = await orchestrator.apply_action(
        request.conversation_id, node_id, request.action
    )
    return NodeActionResponse(workflow_state=state, integration_feedback=integration_feedback)


@router.post("/chat")
async def pbl_chat(request: PblChatRequest) -> StreamingResponse:
    """PBL 聊天接口，使用 TutorOrchestrator 协调教学"""
    import json

    state = await get_workflow_state(request.conversation_id)

    # 获取当前节点
    current_node = None
    if state.current_node_id:
        from ..learning.session_service import get_node_by_id
        current_node = await get_node_by_id(state.current_node_id)

    # 如果没有当前节点，降级到通用 chat
    if not current_node:
        plugin_caps = await get_plugin_capabilities_for_user("default")
        pbl_context = build_pbl_chat_context(state)
        system_prompt = build_pbl_system_prompt(pbl_context, plugin_capabilities=plugin_caps)
        messages = [{"role": "system", "content": system_prompt}] + [
            {"role": message.role, "content": message.content}
            for message in request.messages
        ]
        user_content = request.messages[-1].content if request.messages else ""

        await record_event(
            conversation_id=request.conversation_id,
            goal_id=state.goal.id,
            node_id=state.current_node_id,
            event_type="pbl_chat_started",
            payload={"message_count": len(request.messages), "mode": "generic"},
        )

        return StreamingResponse(
            llm_event_stream(
                messages,
                stream_chat,
                request.conversation_id,
                user_content,
                persist=True,
                node_id=None,
            ),
            media_type="text/event-stream",
            headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
        )

    # 使用 TutorOrchestrator
    orchestrator = TutorOrchestrator()
    user_message = request.messages[-1].content if request.messages else ""
    conversation_history = [
        {"role": msg.role, "content": msg.content}
        for msg in request.messages[:-1]
    ]

    async def tutor_stream():
        try:
            full_response = ""
            async for event in orchestrator.teach_streaming(
                workflow_state=state,
                current_node=current_node,
                user_message=user_message,
                conversation_history=conversation_history,
            ):
                # 从 SSE 事件中提取文本内容
                if event.startswith("data: "):
                    try:
                        data = json.loads(event[6:])
                        if data.get("type") == "text":
                            full_response += data.get("content", "")
                    except json.JSONDecodeError:
                        pass
                yield event

            # 持久化消息
            from ..services.streaming import persist_messages
            await persist_messages(
                request.conversation_id,
                user_message,
                full_response,
                node_id=state.current_node_id,
            )

            # 发送完成事件
            yield f"data: {json.dumps({'type': 'done'})}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'message': str(e)})}\n\n"

    await record_event(
        conversation_id=request.conversation_id,
        goal_id=state.goal.id,
        node_id=state.current_node_id,
        event_type="pbl_chat_started",
        payload={"message_count": len(request.messages), "mode": "tutor"},
    )

    return StreamingResponse(
        tutor_stream(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )


@router.post("/nodes/{node_id}/assessment", response_model=AssessmentResponse)
async def generate_assessment(
    node_id: str, request: GenerateAssessmentRequest
) -> AssessmentResponse:
    """为指定节点生成测评题"""
    from ..learning.session_service import get_node_by_id
    from datetime import datetime

    # 获取节点和工作流状态
    state = await get_workflow_state(request.conversation_id)
    node = await get_node_by_id(node_id)

    if not node:
        raise HTTPException(status_code=404, detail=f"Node not found: {node_id}")

    # 调用 AssessmentDesignerAgent
    agent = AssessmentDesignerAgent()
    result = await agent.run(
        AssessmentDesignerInput(node=node, goal=state.goal)
    )

    if not result.is_success:
        raise HTTPException(
            status_code=500, detail=f"Assessment generation failed: {result.error}"
        )

    # 保存测评
    assessment = Assessment(
        id=str(uuid.uuid4()),
        node_id=node_id,
        goal_id=state.goal.id,
        questions=result.data.questions,
        created_at=datetime.now().isoformat(),
    )
    await save_assessment(assessment)

    # 记录事件
    await record_event(
        conversation_id=request.conversation_id,
        goal_id=state.goal.id,
        node_id=node_id,
        event_type="assessment_generated",
        payload={"assessment_id": assessment.id, "question_count": len(assessment.questions)},
    )

    return AssessmentResponse(assessment=assessment)


@router.post("/assessments/{assessment_id}/submit", response_model=JudgmentResponse)
async def submit_assessment(
    assessment_id: str, request: SubmitAssessmentRequest
) -> JudgmentResponse:
    """提交测评答案，获取判定结果"""
    from ..learning.session_service import get_node_by_id
    from datetime import datetime

    # 获取测评和节点
    assessment = await get_assessment_by_id(assessment_id)
    node = await get_node_by_id(assessment.node_id)
    state = await get_workflow_state(request.conversation_id)

    if not node:
        raise HTTPException(status_code=404, detail=f"Node not found: {assessment.node_id}")

    # 验证答案数量
    if len(request.user_answers) != len(assessment.questions):
        raise HTTPException(
            status_code=400,
            detail=f"Expected {len(assessment.questions)} answers, got {len(request.user_answers)}",
        )

    # 调用 MasteryJudgeAgent
    agent = MasteryJudgeAgent()
    result = await agent.run(
        MasteryJudgeInput(
            node=node,
            questions=assessment.questions,
            user_answers=request.user_answers,
        )
    )

    if not result.is_success:
        raise HTTPException(
            status_code=500, detail=f"Mastery judgment failed: {result.error}"
        )

    # 保存测评尝试
    attempt = AssessmentAttempt(
        id=str(uuid.uuid4()),
        assessment_id=assessment_id,
        conversation_id=request.conversation_id,
        node_id=assessment.node_id,
        user_answers=request.user_answers,
        status=result.data.status,
        score=result.data.score,
        reasoning=result.data.reasoning,
        weak_points=result.data.weak_points,
        suggestions=result.data.suggestions,
        created_at=datetime.now().isoformat(),
    )
    await save_assessment_attempt(attempt)

    # 根据判定结果更新节点状态
    orchestrator = LearningOrchestrator()
    if result.data.status == "mastered":
        action = "mastered"
    elif result.data.status == "review":
        action = "review"
    else:  # learning
        action = "learn"

    updated_state, _ = await orchestrator.apply_action(
        request.conversation_id, assessment.node_id, action
    )

    # 记录事件
    await record_event(
        conversation_id=request.conversation_id,
        goal_id=state.goal.id,
        node_id=assessment.node_id,
        event_type="assessment_submitted",
        payload={
            "attempt_id": attempt.id,
            "status": attempt.status,
            "score": attempt.score,
        },
    )

    return JudgmentResponse(attempt=attempt, workflow_state=updated_state)
