from typing import Type, Literal
from pydantic import BaseModel, Field

from .base import BaseAgent
from .llm_client import LLMClient
from .config import AgentConfig


class GoalClarifierInput(BaseModel):
    """目标澄清器输入"""

    raw_input: str = Field(..., description="用户的原始输入")
    conversation_id: str = Field(..., description="对话 ID")


class GoalClarifierOutput(BaseModel):
    """目标澄清器输出"""

    title: str = Field(..., max_length=80, description="项目标题")
    domains: list[str] = Field(..., description="涉及的领域")
    artifact_type: Literal["interactive_app", "simulation", "tool", "project"] = Field(
        ..., description="产物类型"
    )
    difficulty: Literal["beginner", "intermediate", "advanced"] = Field(
        ..., description="难度等级"
    )
    constraints: dict = Field(default_factory=dict, description="约束条件")
    reasoning: str = Field(..., description="分析推理过程")


class GoalClarifierAgent(BaseAgent[GoalClarifierInput, GoalClarifierOutput]):
    """
    目标澄清 Agent
    根据用户的原始输入，分析并提取项目元数据
    """

    def __init__(self):
        config = AgentConfig(
            temperature=0.3,  # 较低温度，更确定性的输出
            max_retries=3,
        )
        super().__init__(config)
        self.llm_client = LLMClient(
            max_retries=config.max_retries,
            retry_delay_base=config.retry_delay_base,
        )

    def get_input_schema(self) -> Type[GoalClarifierInput]:
        return GoalClarifierInput

    def get_output_schema(self) -> Type[GoalClarifierOutput]:
        return GoalClarifierOutput

    def get_system_prompt(self, input_data: GoalClarifierInput) -> str:
        return """你是一个项目目标分析专家。根据用户的原始输入，分析并提取以下信息：

1. **项目标题**（title）：
   - 简洁明了，不超过 80 字
   - 能准确概括项目核心目标
   - 使用中文

2. **涉及的领域**（domains）：
   - 从以下选项中选择一个或多个：physics, math, frontend, ai, general
   - physics: 物理相关（如力学、振动、光学等）
   - math: 数学相关（如函数、方程、几何等）
   - frontend: 前端开发（如 React、网页、UI 等）
   - ai: 人工智能（如模型、Transformer、LLM 等）
   - general: 通用（无法归类到上述领域）

3. **产物类型**（artifact_type）：
   - interactive_app: 交互式应用（如网页应用、移动应用）
   - simulation: 模拟器（如物理模拟、数学可视化）
   - tool: 工具（如计算器、转换器）
   - project: 通用项目（无法归类到上述类型）

4. **难度等级**（difficulty）：
   - beginner: 初学者（基础概念，简单实现）
   - intermediate: 中级（需要一定基础，中等复杂度）
   - advanced: 高级（需要深入理解，高复杂度）

5. **约束条件**（constraints）：
   - 如果用户提到特定的技术栈、时间限制、资源限制等，记录在这里
   - 如果没有明确约束，返回空对象 {}

6. **分析推理过程**（reasoning）：
   - 简要说明你是如何得出上述结论的
   - 2-3 句话即可

分析要求：
- 仔细阅读用户输入，理解其真实意图
- 如果输入模糊，做出合理推断
- 优先选择更具体的领域和类型
- 难度评估要考虑目标的复杂度和所需知识深度
"""

    async def process(self, input_data: GoalClarifierInput) -> GoalClarifierOutput:
        """执行目标澄清"""
        system_prompt = self.get_system_prompt(input_data)

        messages = [
            {"role": "system", "content": system_prompt},
            {
                "role": "user",
                "content": f"请分析以下项目目标：\n\n{input_data.raw_input}",
            },
        ]

        # 调用 LLM 获取结构化输出
        output = await self.llm_client.call_structured(
            messages=messages,
            response_model=GoalClarifierOutput,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens,
            model_override=self.config.model_override,
        )

        return output
