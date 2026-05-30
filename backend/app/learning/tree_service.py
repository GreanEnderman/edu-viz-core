from .schemas import LearningNode


def validate_tree(nodes: list[LearningNode]) -> None:
    “””验证学习树的结构完整性”””
    node_ids = {node.id for node in nodes}
    if len(node_ids) != len(nodes):
        raise ValueError(“Learning tree contains duplicate node IDs”)

    for node in nodes:
        if node.parent_id is not None and node.parent_id not in node_ids:
            raise ValueError(f”Node {node.id} has unknown parent_id”)
        for child_id in node.children:
            if child_id not in node_ids:
                raise ValueError(f”Node {node.id} has unknown child_id”)
        for prerequisite_id in node.prerequisites:
            if prerequisite_id not in node_ids:
                raise ValueError(f”Node {node.id} has unknown prerequisite_id”)

    node_map = {node.id: node for node in nodes}
    for node in nodes:
        for child_id in node.children:
            if node_map[child_id].parent_id != node.id:
                raise ValueError(f”Node {child_id} parent mismatch”)

