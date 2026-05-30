from fastapi import HTTPException

from ..learning.schemas import LearningWorkflowState, NodeAction
from ..learning.session_service import (
    get_goal_by_id,
    get_nodes_by_goal,
    get_workflow_state,
    record_event,
    save_workflow_state,
    update_node_status,
)
from .transitions import apply_node_action, derive_workflow_mode, find_next_node_id
from .integration_service import IntegrationService


class LearningOrchestrator:
    def __init__(self):
        self.integration_service = IntegrationService()

    async def apply_action(
        self,
        conversation_id: str,
        node_id: str,
        action: NodeAction,
    ) -> tuple[LearningWorkflowState, dict | None]:
        """
        应用节点动作并更新状态

        Returns:
            (workflow_state, integration_feedback): 工作流状态和集成反馈（如果有）
        """
        state = await get_workflow_state(conversation_id)
        nodes = await get_nodes_by_goal(state.goal.id)
        node_map = {node.id: node for node in nodes}
        node = node_map.get(node_id)
        if node is None:
            raise HTTPException(status_code=404, detail="Node not found")

        new_status, mode = apply_node_action(node.status, action)
        await update_node_status(node_id, new_status)

        nodes = await get_nodes_by_goal(state.goal.id)
        node_map = {item.id: item for item in nodes}
        self._promote_parent_nodes(node_map)
        nodes = list(node_map.values())

        for promoted_node in nodes:
            await update_node_status(promoted_node.id, promoted_node.status)

        refreshed_goal = await get_goal_by_id(state.goal.id)
        refreshed_mode = derive_workflow_mode(nodes, mode)
        next_node_id = find_next_node_id(nodes)
        new_state = LearningWorkflowState(
            conversation_id=conversation_id,
            goal=refreshed_goal,
            knowledge_tree=nodes,
            current_node_id=next_node_id,
            current_mode=refreshed_mode,
            mastered_node_ids=[item.id for item in nodes if item.status == "mastered"],
            weak_node_ids=[item.id for item in nodes if item.status in {"review", "learning"}],
            skipped_node_ids=[item.id for item in nodes if item.status == "skipped"],
            project_milestones=self._build_project_milestones(nodes),
        )
        await save_workflow_state(new_state)

        # 如果节点变为 mastered，生成集成反馈
        integration_feedback = None
        if new_status == "mastered":
            integration_feedback = await self.integration_service.generate_integration_feedback(
                completed_node=node,
                goal=refreshed_goal,
                workflow_state=new_state,
            )

            # 记录集成反馈事件
            await record_event(
                conversation_id=conversation_id,
                goal_id=state.goal.id,
                node_id=node_id,
                event_type="node_integrated",
                payload=integration_feedback,
            )

        await record_event(
            conversation_id=conversation_id,
            goal_id=state.goal.id,
            node_id=node_id,
            event_type="node_action",
            payload={"action": action, "new_status": new_status, "current_mode": refreshed_mode},
        )
        final_state = await get_workflow_state(conversation_id)
        return final_state, integration_feedback

    def _promote_parent_nodes(self, node_map: dict[str, object]) -> None:
        changed = True
        while changed:
            changed = False
            for node in node_map.values():
                if not node.children:
                    continue
                child_nodes = [node_map[child_id] for child_id in node.children]
                if all(child.status in {"mastered", "skipped"} for child in child_nodes):
                    new_status = "mastered" if all(child.status == "mastered" for child in child_nodes) else "review"
                    if node.status != new_status:
                        node.status = new_status
                        changed = True

    def _build_project_milestones(self, nodes: list[object]) -> list[dict]:
        return [
            {"node_id": node.id, "title": node.title, "status": node.status}
            for node in nodes
            if node.parent_id is None or node.status in {"mastered", "review", "learning"}
        ]
