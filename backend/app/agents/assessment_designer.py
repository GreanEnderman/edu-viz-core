from typing import Type
from pydantic import BaseModel, Field

from .base import BaseAgent
from .llm_client import LLMClient
from .config import AgentConfig
from ..learning.schemas import LearningNode, ProjectGoal, AssessmentQuestion


class AssessmentDesignerInput(BaseModel):
    """测评设计器输入"""

    node: LearningNode = Field(..., description="当前学习节点")
    goal: ProjectGoal = Field(..., description="项目目标")


class AssessmentDesignerOutput(BaseModel):
    """测评设计器输出"""

    questions: list[AssessmentQuestion] = Field(..., description="测评题列表（2-3道）")
    reasoning: str = Field(..., description="设计思路")


class AssessmentDesignerAgent(BaseAgent[AssessmentDesignerInput, AssessmentDesignerOutput]):
    """
    测评设计 Agent
    为当前学习节点设计 2-3 道测评题
    """

    def __init__(self):
        config = AgentConfig(
            temperature=0.6,  # 中等创造性
            max_retries=3,
            max_tokens=2000,
        )
        super().__init__(config)
        self.llm_client = LLMClient(
            max_retries=config.max_retries,
            retry_delay_base=config.retry_delay_base,
        )

    def get_input_schema(self) -> Type[AssessmentDesignerInput]:
        return AssessmentDesignerInput

    def get_output_schema(self) -> Type[AssessmentDesignerOutput]:
        return AssessmentDesignerOutput

    def get_system_prompt(self, input_data: AssessmentDesignerInput) -> str:
        node = input_data.node
        goal = input_data.goal

        mastery_criteria_str = "\n".join(f"   - {c}" for c in node.mastery_criteria)

        return f"""你是一个教育测评设计专家。根据学习节点和项目目标，设计 2-3 道测评题。

当前节点信息：
- 标题：{node.title}
- 描述：{node.description}
- 掌握标准：
{mastery_criteria_str}
- 项目关联：{node.project_relevance}
- 难度：{node.estimated_difficulty}

项目目标：
- 标题：{goal.title}
- 类型：{goal.artifact_type}
- 领域：{', '.join(goal.domains)}
- 难度：{goal.difficulty}

设计要求：

1. **题目数量**：2-3 道

2. **题型选择**：
   - multiple_choice: 概念理解、原理判断
     * question: 题目内容
     * options: 4 个选项（列表形式）
     * reference_answer: 正确答案（选项内容，不是序号）
   - short_answer: 解释说明、简单推导
     * question: 题目内容
     * options: 空列表 []
     * reference_answer: 参考答案或判定依据

3. **难度分布**：
   - 至少 1 道 easy（基础概念）
   - 至少 1 道 medium（应用理解）
   - 可选 1 道 hard（综合应用）

4. **题目质量**：
   - 紧扣节点的 mastery_criteria
   - 避免死记硬背，注重理解和应用
   - 参考答案要具体、可验证
   - 题目表述清晰、无歧义

5. **项目关联**：
   - 题目应与项目目标相关
   - 优先设计能应用到项目中的题目
   - 体现知识的实际价值

6. **ID 生成**：
   - 使用简单格式，如 "q1", "q2", "q3"

输出要求：
- questions 数组包含 2-3 道题
- 每道题必须包含所有必需字段
- reasoning 说明你的设计思路（2-3 句话）

示例输出格式：
{{
  "questions": [
    {{
      "id": "q1",
      "type": "multiple_choice",
      "question": "简谐振动的三要素是什么？",
      "options": ["振幅、频率、相位", "速度、加速度、位移", "质量、弹簧常数、阻尼", "动能、势能、机械能"],
      "reference_answer": "振幅、频率、相位",
      "difficulty": "easy"
    }},
    {{
      "id": "q2",
      "type": "short_answer",
      "question": "请解释简谐振动中相位的物理意义。",
      "options": [],
      "reference_answer": "相位描述了振动的初始状态，决定了物体在 t=0 时刻的位置和运动方向。相位不同的简谐振动，即使振幅和频率相同，其运动状态也不同。",
      "difficulty": "medium"
    }}
  ],
  "reasoning": "第一题考查基础概念，第二题考查对相位的深入理解。"
}}
"""

    async def process(self, input_data: AssessmentDesignerInput) -> AssessmentDesignerOutput:
        """执行测评设计"""
        system_prompt = self.get_system_prompt(input_data)

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "请为当前节点设计测评题。"},
        ]

        # 调用 LLM 获取结构化输出
        output = await self.llm_client.call_structured(
            messages=messages,
            response_model=AssessmentDesignerOutput,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens,
            model_override=self.config.model_override,
        )

        # 验证题目数量
        if len(output.questions) < 2 or len(output.questions) > 3:
            raise ValueError(f"Expected 2-3 questions, got {len(output.questions)}")

        return output
