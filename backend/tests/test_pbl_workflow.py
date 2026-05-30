import unittest
from unittest.mock import patch

from backend.app.agents.base import AgentResult
from backend.app.agents.curriculum_architect import CurriculumArchitectOutput
from backend.app.agents.goal_clarifier import GoalClarifierOutput
from backend.app.agents.tutor import TutorAgentOutput
from backend.app.agents.visualizer import VisualizerAgentOutput
from backend.app.core.config import settings
from backend.app.db import close_db, get_db, init_db
from backend.app.learning.schemas import (
    CreateGoalRequest,
    LearningNode,
    LearningWorkflowState,
    NodeActionRequest,
    PblChatRequest,
    ProjectGoal,
)
from backend.app.routers.pbl import (
    apply_node_action,
    create_goal,
    delete_goal,
    generate_goal_tree,
    get_goal_detail,
    get_pbl_workflow_state,
    list_goals,
    pbl_chat,
)
from backend.app.workflow.tutor_orchestrator import TutorOrchestrator


class PblWorkflowTests(unittest.IsolatedAsyncioTestCase):
    async def asyncSetUp(self) -> None:
        self._original_database_path = settings.DATABASE_PATH
        settings.DATABASE_PATH = ":memory:"
        await close_db()
        await init_db()

        async def fake_goal_run(_agent_self, _input_data):
            return AgentResult(
                success=True,
                data=GoalClarifierOutput(
                    title="弹簧振子模拟器",
                    domains=["physics", "frontend"],
                    artifact_type="simulation",
                    difficulty="intermediate",
                    constraints={},
                    reasoning="test fixture",
                ),
            )

        async def fake_tree_run(_agent_self, input_data):
            return AgentResult(
                success=True,
                data=CurriculumArchitectOutput(
                    nodes=self._build_tree_fixture(input_data.goal.id),
                    reasoning="test fixture",
                ),
            )

        self._goal_run_patcher = patch("backend.app.routers.pbl.GoalClarifierAgent.run", new=fake_goal_run)
        self._tree_run_patcher = patch("backend.app.routers.pbl.CurriculumArchitectAgent.run", new=fake_tree_run)
        self._goal_run_patcher.start()
        self._tree_run_patcher.start()

    async def asyncTearDown(self) -> None:
        self._goal_run_patcher.stop()
        self._tree_run_patcher.stop()
        await close_db()
        settings.DATABASE_PATH = self._original_database_path

    def _build_tree_fixture(self, goal_id: str) -> list[LearningNode]:
        return [
            LearningNode(
                id="node-root",
                goal_id=goal_id,
                parent_id=None,
                title="弹簧振子模拟器",
                description="完成项目总目标。",
                children=["node-foundation", "node-principles", "node-implementation"],
                prerequisites=[],
                mastery_criteria=["能够描述项目目标"],
                estimated_difficulty="medium",
                status="unknown",
                component_hints=["PhysicsOscillator"],
                project_relevance="作为整个项目的顶层目标。",
            ),
            LearningNode(
                id="node-foundation",
                goal_id=goal_id,
                parent_id="node-root",
                title="基础概念",
                description="理解简谐运动与相关术语。",
                children=["node-displacement", "node-period"],
                prerequisites=[],
                mastery_criteria=["能够解释振幅和位移"],
                estimated_difficulty="easy",
                status="unknown",
                component_hints=["PhysicsOscillator"],
                project_relevance="支撑后续公式和交互实现。",
            ),
            LearningNode(
                id="node-principles",
                goal_id=goal_id,
                parent_id="node-root",
                title="核心原理",
                description="掌握回复力和周期关系。",
                children=["node-force", "node-equation"],
                prerequisites=["node-foundation"],
                mastery_criteria=["能够推导基本关系"],
                estimated_difficulty="medium",
                status="unknown",
                component_hints=["PhysicsOscillator"],
                project_relevance="决定模拟器的计算模型。",
            ),
            LearningNode(
                id="node-implementation",
                goal_id=goal_id,
                parent_id="node-root",
                title="项目实现",
                description="将物理模型转成前端可交互界面。",
                children=["node-ui", "node-animation"],
                prerequisites=["node-principles"],
                mastery_criteria=["能够搭建可运行原型"],
                estimated_difficulty="hard",
                status="unknown",
                component_hints=["PhysicsOscillator"],
                project_relevance="直接产出项目成果。",
            ),
            LearningNode(
                id="node-displacement",
                goal_id=goal_id,
                parent_id="node-foundation",
                title="位移与振幅",
                description="区分位移、振幅、平衡位置。",
                children=[],
                prerequisites=[],
                mastery_criteria=["能够说明三者区别"],
                estimated_difficulty="easy",
                status="unknown",
                component_hints=[],
                project_relevance="帮助理解图像和参数输入。",
            ),
            LearningNode(
                id="node-period",
                goal_id=goal_id,
                parent_id="node-foundation",
                title="周期与频率",
                description="理解周期和频率之间的关系。",
                children=[],
                prerequisites=[],
                mastery_criteria=["能够在周期和频率间换算"],
                estimated_difficulty="easy",
                status="unknown",
                component_hints=[],
                project_relevance="用于控制模拟速度。",
            ),
            LearningNode(
                id="node-force",
                goal_id=goal_id,
                parent_id="node-principles",
                title="回复力",
                description="理解胡克定律和回复力方向。",
                children=[],
                prerequisites=["node-foundation"],
                mastery_criteria=["能够解释回复力方向"],
                estimated_difficulty="medium",
                status="unknown",
                component_hints=[],
                project_relevance="决定速度和加速度变化。",
            ),
            LearningNode(
                id="node-equation",
                goal_id=goal_id,
                parent_id="node-principles",
                title="振动方程",
                description="理解位移与时间的函数关系。",
                children=[],
                prerequisites=["node-foundation"],
                mastery_criteria=["能够写出简谐运动方程"],
                estimated_difficulty="medium",
                status="unknown",
                component_hints=[],
                project_relevance="作为动画轨迹计算基础。",
            ),
            LearningNode(
                id="node-ui",
                goal_id=goal_id,
                parent_id="node-implementation",
                title="交互界面",
                description="设计参数输入和结果展示。",
                children=[],
                prerequisites=["node-principles"],
                mastery_criteria=["能够设计参数面板"],
                estimated_difficulty="medium",
                status="unknown",
                component_hints=[],
                project_relevance="影响用户操作体验。",
            ),
            LearningNode(
                id="node-animation",
                goal_id=goal_id,
                parent_id="node-implementation",
                title="动画驱动",
                description="让模拟器随着时间更新状态。",
                children=[],
                prerequisites=["node-principles"],
                mastery_criteria=["能够驱动动画刷新"],
                estimated_difficulty="hard",
                status="unknown",
                component_hints=[],
                project_relevance="形成可观察的模拟效果。",
            ),
        ]

    async def test_create_goal_generate_tree_and_restore_state(self) -> None:
        created = await create_goal(CreateGoalRequest(raw_input="我想做一个弹簧振子模拟器"))
        self.assertEqual(created.workflow_state.current_mode, "planning")
        self.assertEqual(created.workflow_state.knowledge_tree, [])

        tree = await generate_goal_tree(created.goal.id)
        self.assertGreaterEqual(len(tree.nodes), 7)

        restored = await get_pbl_workflow_state(created.goal.conversation_id)
        self.assertEqual(restored.goal.id, created.goal.id)
        self.assertEqual(len(restored.knowledge_tree), len(tree.nodes))
        self.assertIsNotNone(restored.current_node_id)

    async def test_node_actions_update_state_and_record_events(self) -> None:
        created = await create_goal(CreateGoalRequest(raw_input="我想做一个弹簧振子模拟器"))
        tree = await generate_goal_tree(created.goal.id)
        leaf_node = next(node for node in tree.nodes if not node.children and node.parent_id is not None)

        learned = await apply_node_action(
            leaf_node.id,
            NodeActionRequest(conversation_id=created.goal.conversation_id, action="learn"),
        )
        self.assertEqual(learned.workflow_state.current_mode, "learning")
        refreshed_leaf = next(node for node in learned.workflow_state.knowledge_tree if node.id == leaf_node.id)
        self.assertEqual(refreshed_leaf.status, "learning")

        completed = await apply_node_action(
            leaf_node.id,
            NodeActionRequest(conversation_id=created.goal.conversation_id, action="complete"),
        )
        completed_leaf = next(node for node in completed.workflow_state.knowledge_tree if node.id == leaf_node.id)
        self.assertEqual(completed_leaf.status, "mastered")
        self.assertIn(leaf_node.id, completed.workflow_state.mastered_node_ids)

        db = get_db()
        event_rows = await db.execute_fetchall(
            "SELECT event_type FROM pbl_events WHERE conversation_id = ? ORDER BY created_at ASC",
            (created.goal.conversation_id,),
        )
        event_types = [row["event_type"] for row in event_rows]
        self.assertIn("goal_created", event_types)
        self.assertIn("tree_generated", event_types)
        self.assertIn("node_action", event_types)

    async def test_list_goals_returns_latest_first_with_domains(self) -> None:
        first = await create_goal(CreateGoalRequest(raw_input="做一个弹簧振子模拟器"))
        second = await create_goal(CreateGoalRequest(raw_input="做一个光学实验"))

        db = get_db()
        await db.execute(
            "UPDATE pbl_goals SET updated_at = datetime('now', '-1 minute') WHERE id = ?",
            (first.goal.id,),
        )
        await db.execute(
            "UPDATE pbl_goals SET updated_at = datetime('now') WHERE id = ?",
            (second.goal.id,),
        )
        await db.commit()

        payload = await list_goals()

        self.assertEqual(len(payload["goals"]), 2)
        self.assertEqual(payload["goals"][0]["id"], second.goal.id)
        self.assertEqual(payload["goals"][1]["id"], first.goal.id)
        self.assertIsInstance(payload["goals"][0]["domains"], list)
        self.assertEqual(payload["goals"][0]["conversation_id"], second.goal.conversation_id)

    async def test_goal_detail_returns_nodes_workflow_and_message_stats(self) -> None:
        created = await create_goal(CreateGoalRequest(raw_input="做一个弹簧振子模拟器"))
        tree = await generate_goal_tree(created.goal.id)
        current_node = tree.nodes[0]

        db = get_db()
        await db.execute(
            """
            INSERT INTO messages (id, conversation_id, role, type, content, node_id)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            ("msg-1", created.goal.conversation_id, "user", "text", "hello", current_node.id),
        )
        await db.execute(
            """
            INSERT INTO messages (id, conversation_id, role, type, content, node_id)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            ("msg-2", created.goal.conversation_id, "assistant", "text", "world", current_node.id),
        )
        await db.commit()

        detail = await get_goal_detail(created.goal.id)

        self.assertEqual(detail["goal"]["id"], created.goal.id)
        self.assertEqual(len(detail["nodes"]), len(tree.nodes))
        self.assertEqual(detail["workflow_state"]["conversation_id"], created.goal.conversation_id)
        self.assertEqual(detail["message_stats"][current_node.id]["count"], 2)
        self.assertIsNotNone(detail["message_stats"][current_node.id]["last_message_at"])

    async def test_delete_goal_removes_conversation_and_related_records(self) -> None:
        created = await create_goal(CreateGoalRequest(raw_input="做一个弹簧振子模拟器"))
        tree = await generate_goal_tree(created.goal.id)

        db = get_db()
        await db.execute(
            """
            INSERT INTO messages (id, conversation_id, role, type, content, node_id)
            VALUES (?, ?, ?, ?, ?, ?)
            """,
            ("msg-delete", created.goal.conversation_id, "user", "text", "hello", tree.nodes[0].id),
        )
        await db.commit()

        await delete_goal(created.goal.id)

        goal_rows = await db.execute_fetchall("SELECT id FROM pbl_goals WHERE id = ?", (created.goal.id,))
        conversation_rows = await db.execute_fetchall(
            "SELECT id FROM conversations WHERE id = ?",
            (created.goal.conversation_id,),
        )
        state_rows = await db.execute_fetchall(
            "SELECT conversation_id FROM pbl_workflow_states WHERE conversation_id = ?",
            (created.goal.conversation_id,),
        )
        node_rows = await db.execute_fetchall(
            "SELECT goal_id FROM pbl_nodes WHERE goal_id = ?",
            (created.goal.id,),
        )
        message_rows = await db.execute_fetchall(
            "SELECT conversation_id FROM messages WHERE conversation_id = ?",
            (created.goal.conversation_id,),
        )

        self.assertEqual(goal_rows, [])
        self.assertEqual(conversation_rows, [])
        self.assertEqual(state_rows, [])
        self.assertEqual(node_rows, [])
        self.assertEqual(message_rows, [])

    async def test_parent_node_promotes_when_children_are_completed(self) -> None:
        created = await create_goal(CreateGoalRequest(raw_input="我想做一个弹簧振子模拟器"))
        tree = await generate_goal_tree(created.goal.id)
        parent = next(node for node in tree.nodes if node.title == "基础概念")
        children = [node for node in tree.nodes if node.parent_id == parent.id]
        result = None
        for child in children:
            result = await apply_node_action(
                child.id,
                NodeActionRequest(conversation_id=created.goal.conversation_id, action="mastered"),
            )

        assert result is not None
        refreshed_parent = next(node for node in result.workflow_state.knowledge_tree if node.id == parent.id)
        self.assertEqual(refreshed_parent.status, "mastered")

    async def test_pbl_chat_streams_sse_and_records_event(self) -> None:
        created = await create_goal(CreateGoalRequest(raw_input="我想做一个弹簧振子模拟器"))
        await generate_goal_tree(created.goal.id)

        async def fake_teach_streaming(_orchestrator_self, workflow_state, current_node, user_message, conversation_history):
            self.assertEqual(workflow_state.goal.id, created.goal.id)
            self.assertEqual(current_node.id, workflow_state.current_node_id)
            self.assertEqual(conversation_history, [])
            self.assertTrue(user_message)
            yield 'data: {"type": "text", "content": "先看当前节点"}\n\n'
            yield 'data: {"type": "a2ui", "content": "{\\"surfaceUpdate\\":{\\"surfaceId\\":\\"main\\",\\"components\\":[]}}"}\n\n'

        with patch("backend.app.routers.pbl.TutorOrchestrator.teach_streaming", fake_teach_streaming):
            response = await pbl_chat(
                PblChatRequest(
                    conversation_id=created.goal.conversation_id,
                    messages=[{"role": "user", "content": "解释一下这个节点"}],
                )
            )
            chunks: list[str] = []
            async for chunk in response.body_iterator:
                chunks.append(chunk)

        payload = "".join(chunks)
        self.assertIn('"type": "text"', payload)
        self.assertIn('"type": "a2ui"', payload)
        self.assertIn('"type": "done"', payload)

        db = get_db()
        event_rows = await db.execute_fetchall(
            "SELECT event_type FROM pbl_events WHERE conversation_id = ? ORDER BY created_at ASC",
            (created.goal.conversation_id,),
        )
        event_types = [row["event_type"] for row in event_rows]
        self.assertIn("pbl_chat_started", event_types)

    async def test_tutor_orchestrator_emits_a2ui_when_visualization_is_requested(self) -> None:
        goal = ProjectGoal(
            id="goal-a2ui",
            conversation_id="conversation-a2ui",
            raw_input="测试可视化",
            title="测试可视化",
            domains=["genetics"],
            artifact_type="learning",
            difficulty="beginner",
            constraints={},
        )
        node = LearningNode(
            id="node-a2ui",
            goal_id=goal.id,
            parent_id=None,
            title="DNA 双螺旋结构",
            description="理解 DNA 碱基配对和双螺旋结构。",
            children=[],
            prerequisites=[],
            mastery_criteria=["能够说明 A-T 与 C-G 配对"],
            estimated_difficulty="easy",
            status="learning",
            component_hints=["DNAStructure"],
            project_relevance="用于理解遗传病突变机制。",
        )
        state = LearningWorkflowState(
            conversation_id=goal.conversation_id,
            goal=goal,
            knowledge_tree=[node],
            current_node_id=node.id,
            current_mode="learning",
            mastered_node_ids=[],
            weak_node_ids=[],
            skipped_node_ids=[],
            project_milestones=[],
        )

        async def fake_tutor_run(_agent_self, _input_data):
            return AgentResult(
                success=True,
                data=TutorAgentOutput(
                    content="DNA 像一条由碱基配对组成的双螺旋梯子。",
                    should_visualize=True,
                    visualization_context={
                        "concept": "DNA 双螺旋结构",
                        "reason": "通过结构图理解碱基配对",
                        "suggested_components": ["DNAStructure"],
                    },
                    next_action_suggestion=None,
                ),
            )

        async def fake_visualizer_run(_agent_self, _input_data):
            return AgentResult(
                success=True,
                data=VisualizerAgentOutput(
                    should_visualize=True,
                    visualization_type="a2ui",
                    component_hints=["DNAStructure"],
                    visual_goal="展示 DNA 双螺旋结构",
                    reasoning="结构概念适合可视化。",
                ),
            )

        async def fake_plugin_caps(_user_id):
            return []

        async def fake_stream_chat(_messages):
            yield '{"surfaceUpdate":{"surfaceId":"main","components":[{"id":"title","component":{"Text":{"text":{"literalString":"DNA 双螺旋"},"usageHint":"h2"}}}]}}\n'
            yield '{"beginRendering":{"surfaceId":"main","root":"title"}}\n'

        with (
            patch("backend.app.workflow.tutor_orchestrator.TutorAgent.run", new=fake_tutor_run),
            patch("backend.app.workflow.tutor_orchestrator.VisualizerAgent.run", new=fake_visualizer_run),
            patch("backend.app.workflow.tutor_orchestrator.get_plugin_capabilities_for_user", new=fake_plugin_caps),
            patch("backend.app.workflow.tutor_orchestrator.stream_chat", new=fake_stream_chat),
        ):
            chunks = [
                chunk
                async for chunk in TutorOrchestrator().teach_streaming(
                    workflow_state=state,
                    current_node=node,
                    user_message="生成可视化",
                    conversation_history=[],
                )
            ]

        payload = "".join(chunks)
        self.assertIn('"type": "text"', payload)
        self.assertIn('"type": "a2ui"', payload)
        self.assertIn("surfaceUpdate", payload)
        self.assertIn("beginRendering", payload)


if __name__ == "__main__":
    unittest.main()
