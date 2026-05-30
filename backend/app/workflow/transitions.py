from ..learning.schemas import LearningNode, WorkflowMode


def apply_node_action(current_status: str, action: str) -> tuple[str, WorkflowMode]:
    if action == "mastered":
        return "mastered", "review"
    if action == "review":
        return "review", "review"
    if action == "assess":
        return current_status, "assessment"
    if action == "learn":
        return "learning", "learning"
    if action == "complete":
        if current_status in {"learning", "review", "unknown"}:
            return "mastered", "review"
        return current_status, "review"
    if action == "skip":
        return "skipped", "planning"
    raise ValueError(f"Unsupported action: {action}")


def derive_workflow_mode(nodes: list[LearningNode], current_mode: WorkflowMode) -> WorkflowMode:
    if not nodes:
        return current_mode

    root_nodes = [node for node in nodes if node.parent_id is None]
    if not root_nodes:
        return current_mode

    if all(node.status in {"mastered", "skipped"} for node in nodes if node.parent_id is not None):
        return "building"

    if any(node.status == "learning" for node in nodes):
        return "learning"

    if any(node.status == "review" for node in nodes):
        return "review"

    return current_mode


def find_next_node_id(nodes: list[LearningNode]) -> str | None:
    node_map = {node.id: node for node in nodes}

    def walk(node: LearningNode) -> str | None:
        if node.status not in {"mastered", "skipped"} and node.parent_id is not None:
            return node.id
        for child_id in node.children:
            result = walk(node_map[child_id])
            if result:
                return result
        return None

    root_nodes = [node for node in nodes if node.parent_id is None]
    for root in root_nodes:
        for child_id in root.children:
            result = walk(node_map[child_id])
            if result:
                return result
    return root_nodes[0].id if root_nodes else None
