from .schemas import LearningWorkflowState


def build_pbl_chat_context(state: LearningWorkflowState) -> str:
    current_node = next(
        (node for node in state.knowledge_tree if node.id == state.current_node_id),
        None,
    )
    current_node_section = "当前暂无激活节点，请帮助用户继续规划下一步。"
    if current_node is not None:
        current_node_section = "\n".join(
            [
                f"当前节点标题：{current_node.title}",
                f"当前节点说明：{current_node.description}",
                f"当前节点状态：{current_node.status}",
                f"掌握标准：{'；'.join(current_node.mastery_criteria) if current_node.mastery_criteria else '无'}",
                f"项目关联：{current_node.project_relevance}",
                f"组件提示：{', '.join(current_node.component_hints) if current_node.component_hints else '无'}",
            ]
        )

    return "\n".join(
        [
            "## PBL Workflow Context",
            f"项目目标：{state.goal.title}",
            f"原始目标：{state.goal.raw_input}",
            f"项目类型：{state.goal.artifact_type}",
            f"领域：{', '.join(state.goal.domains)}",
            f"当前模式：{state.current_mode}",
            current_node_section,
            "回答要求：",
            "- 严格围绕当前节点教学，不要跳成整个项目总览。",
            "- 先帮助用户理解当前节点，再必要时给出例子、练习或可视化。",
            "- 如果适合交互式演示，可以输出 A2UI 消息，但必须遵守既有 A2UI 规则。",
            "- 不要自行宣布节点已掌握或已完成，节点状态由后端工作流决定。",
        ]
    )
