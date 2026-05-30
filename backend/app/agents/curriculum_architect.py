from typing import Type
from pydantic import BaseModel, Field

from .base import BaseAgent
from .llm_client import LLMClient
from .config import AgentConfig
from ..learning.schemas import ProjectGoal, LearningNode


class CurriculumArchitectInput(BaseModel):
    """课程架构师输入"""

    goal: ProjectGoal = Field(..., description="项目目标")
    max_depth: int = Field(default=3, description="最大深度")
    max_children_per_node: int = Field(default=3, description="每个节点最多子节点数")


class CurriculumArchitectOutput(BaseModel):
    """课程架构师输出"""

    nodes: list[LearningNode] = Field(..., description="学习节点列表")
    reasoning: str = Field(..., description="树结构设计推理")


class CurriculumArchitectAgent(BaseAgent[CurriculumArchitectInput, CurriculumArchitectOutput]):
    """
    课程架构师 Agent
    根据项目目标，生成层次化的学习路径
    """

    def __init__(self):
        config = AgentConfig(
            temperature=0.5,  # 中等温度，平衡创造性和确定性
            max_retries=3,
            max_tokens=4000,  # 学习树可能较大
        )
        super().__init__(config)
        self.llm_client = LLMClient(
            max_retries=config.max_retries,
            retry_delay_base=config.retry_delay_base,
        )

    def get_input_schema(self) -> Type[CurriculumArchitectInput]:
        return CurriculumArchitectInput

    def get_output_schema(self) -> Type[CurriculumArchitectOutput]:
        return CurriculumArchitectOutput

    def get_system_prompt(self, input_data: CurriculumArchitectInput) -> str:
        goal = input_data.goal
        return f"""你是一个学习路径设计专家。根据项目目标，设计一个层次化的学习树。

项目信息：
- 标题：{goal.title}
- 原始输入：{goal.raw_input}
- 领域：{', '.join(goal.domains)}
- 产物类型：{goal.artifact_type}
- 难度：{goal.difficulty}

学习树设计要求：

1. **树结构**：
   - 根节点：项目总目标（parent_id 为 null）
   - 第二层：3 个主要分支
     * 基础概念（Foundations）
     * 核心原理（Principles）
     * 项目实现（Implementation）
   - 第三层：每个分支下的具体学习任务（每个分支 1-2 个子节点）
   - 最大深度：{input_data.max_depth}
   - 每个节点最多 {input_data.max_children_per_node} 个子节点

   **严格限制**：
   - 树深度：2-3 层（根节点 + 1-2 层子节点）
   - 总节点数：6-12 个（包括根节点）
   - 每个分支下的子节点：1-2 个
   - 避免过度细分，保持学习路径清晰

2. **节点设计**：
   - id: 使用简单格式（如 "node-1", "node-2", "node-3"）
   - goal_id: 使用 "{goal.id}"
   - parent_id: 父节点 ID（根节点为 null）
   - title: 节点标题（简洁明了，10-20 字）
   - description: 节点描述（详细说明学习内容，50-100 字）
   - children: 子节点 ID 列表
   - prerequisites: 前置节点 ID 列表（必须先完成的节点）
   - mastery_criteria: 掌握标准列表（2-3 条，可验证的标准）
   - estimated_difficulty: "easy", "medium", "hard"
   - status: 全部设为 "unknown"
   - component_hints: 可用的可视化组件提示（如果是物理相关可以用 ["PhysicsOscillator"]，否则留空 []）
   - project_relevance: 与项目的关联性说明

3. **依赖关系**：
   - 基础概念 → 核心原理 → 项目实现（顺序依赖）
   - 同层节点可以并行学习
   - prerequisites 必须指向已存在的节点

4. **掌握标准**：
   - 必须具体、可验证
   - 使用"能够..."句式
   - 例如："能够解释简谐振动的三要素"、"能够推导振动方程"

5. **难度评估**：
   - easy: 基础概念、术语理解
   - medium: 原理理解、简单应用
   - hard: 综合应用、项目实现

6. **组件提示**：
   - 如果是物理相关（domains 包含 "physics"），可以使用 ["PhysicsOscillator"]
   - 如果需要其他可视化，留空 []

输出要求：
- nodes 数组必须包含所有节点（根节点 + 所有子节点）
- 节点之间的引用关系必须正确（parent_id, children, prerequisites）
- 每个节点的 ID 必须唯一
- reasoning 说明你的设计思路（2-3 句话）
"""

    async def process(self, input_data: CurriculumArchitectInput) -> CurriculumArchitectOutput:
        """执行学习树生成"""
        system_prompt = self.get_system_prompt(input_data)

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "请生成学习树。"},
        ]

        # 调用 LLM 获取结构化输出
        output = await self.llm_client.call_structured(
            messages=messages,
            response_model=CurriculumArchitectOutput,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens,
            model_override=self.config.model_override,
        )

        # 验证树结构的完整性
        self._validate_tree_structure(output.nodes)

        return output

    def _validate_tree_structure(self, nodes: list[LearningNode]) -> None:
        """验证树结构的完整性"""
        if not nodes:
            raise ValueError("Tree must have at least one node")

        node_ids = {node.id for node in nodes}

        # 检查 ID 唯一性
        if len(node_ids) != len(nodes):
            raise ValueError("Duplicate node IDs found")

        # 检查引用完整性
        for node in nodes:
            if node.parent_id and node.parent_id not in node_ids:
                raise ValueError(
                    f"Node {node.id} has invalid parent_id: {node.parent_id}"
                )

            for child_id in node.children:
                if child_id not in node_ids:
                    raise ValueError(
                        f"Node {node.id} has invalid child_id: {child_id}"
                    )

            for prereq_id in node.prerequisites:
                if prereq_id not in node_ids:
                    raise ValueError(
                        f"Node {node.id} has invalid prerequisite: {prereq_id}"
                    )

        # 检查根节点
        root_nodes = [n for n in nodes if n.parent_id is None]
        if len(root_nodes) != 1:
            raise ValueError(
                f"Tree must have exactly one root node, found {len(root_nodes)}"
            )
