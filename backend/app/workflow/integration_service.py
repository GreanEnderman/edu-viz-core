"""
节点集成服务
负责在节点完成时生成集成反馈
"""

from ..learning.schemas import LearningNode, ProjectGoal, LearningWorkflowState


class IntegrationService:
    """
    节点集成服务

    职责：
    1. 在节点标记为 mastered 时生成集成反馈
    2. 总结学习成果
    3. 说明如何应用到项目中
    4. 提示下一步学习方向
    """

    async def generate_integration_feedback(
        self,
        completed_node: LearningNode,
        goal: ProjectGoal,
        workflow_state: LearningWorkflowState,
    ) -> dict:
        """
        生成节点完成后的集成反馈

        Args:
            completed_node: 已完成的节点
            goal: 项目目标
            workflow_state: 工作流状态

        Returns:
            集成反馈字典，包含：
            - summary: 总结
            - project_application: 项目应用
            - next_steps: 下一步建议列表
            - progress: 学习进度百分比
        """
        # 计算学习进度
        mastered_count = len(workflow_state.mastered_node_ids)
        total_count = len(workflow_state.knowledge_tree)
        progress_pct = (mastered_count / total_count * 100) if total_count > 0 else 0

        # 找到下一个待学习节点
        next_node = self._find_next_node(workflow_state)

        # 生成总结
        summary = f"恭喜！你已经掌握了「{completed_node.title}」。"

        # 项目应用（使用节点的 project_relevance）
        project_application = completed_node.project_relevance or "这个知识点将在项目中发挥重要作用。"

        # 生成下一步建议
        next_steps = []
        if next_node:
            next_steps.append(f"继续学习「{next_node.title}」")

        if progress_pct >= 80:
            next_steps.append("你已经完成了大部分内容，可以开始动手实践项目了")
        elif progress_pct >= 50:
            next_steps.append("你已经掌握了一半的知识点，继续保持")

        return {
            "summary": summary,
            "project_application": project_application,
            "next_steps": next_steps,
            "progress": progress_pct,
            "completed_node_title": completed_node.title,
            "next_node_title": next_node.title if next_node else None,
        }

    def _find_next_node(self, state: LearningWorkflowState) -> LearningNode | None:
        """
        找到下一个待学习节点

        优先级：
        1. 状态为 unknown 的叶子节点
        2. 状态为 unknown 的非根节点
        3. 状态为 review 的节点

        Args:
            state: 工作流状态

        Returns:
            下一个节点，如果没有则返回 None
        """
        # 优先找 unknown 的叶子节点
        for node in state.knowledge_tree:
            if node.status == "unknown" and not node.children:
                return node

        # 其次找 unknown 的非根节点
        for node in state.knowledge_tree:
            if node.status == "unknown" and node.parent_id is not None:
                return node

        # 最后找 review 的节点
        for node in state.knowledge_tree:
            if node.status == "review":
                return node

        return None
