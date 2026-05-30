from typing import Type, Literal
from pydantic import BaseModel, Field

from .base import BaseAgent
from .llm_client import LLMClient
from .config import AgentConfig
from ..learning.schemas import LearningNode, AssessmentQuestion


class MasteryJudgeInput(BaseModel):
    """掌握度判定器输入"""

    node: LearningNode = Field(..., description="当前学习节点")
    questions: list[AssessmentQuestion] = Field(..., description="测评题")
    user_answers: list[str] = Field(..., description="用户答案列表")


class MasteryJudgeOutput(BaseModel):
    """掌握度判定器输出"""

    status: Literal["mastered", "review", "learning"] = Field(..., description="掌握状态")
    reasoning: str = Field(..., description="判定理由")
    weak_points: list[str] = Field(default_factory=list, description="薄弱点列表")
    suggestions: list[str] = Field(default_factory=list, description="改进建议")
    score: float = Field(..., ge=0.0, le=1.0, description="得分（0-1）")


class MasteryJudgeAgent(BaseAgent[MasteryJudgeInput, MasteryJudgeOutput]):
    """
    掌握度判定 Agent
    判断用户是否掌握当前节点
    """

    def __init__(self):
        config = AgentConfig(
            temperature=0.3,  # 低温度，更确定性
            max_retries=3,
            max_tokens=1500,
        )
        super().__init__(config)
        self.llm_client = LLMClient(
            max_retries=config.max_retries,
            retry_delay_base=config.retry_delay_base,
        )

    def get_input_schema(self) -> Type[MasteryJudgeInput]:
        return MasteryJudgeInput

    def get_output_schema(self) -> Type[MasteryJudgeOutput]:
        return MasteryJudgeOutput

    def get_system_prompt(self, input_data: MasteryJudgeInput) -> str:
        node = input_data.node
        questions = input_data.questions
        user_answers = input_data.user_answers

        mastery_criteria_str = "\n".join(f"   - {c}" for c in node.mastery_criteria)

        qa_pairs = []
        for i, (q, a) in enumerate(zip(questions, user_answers), 1):
            qa_pairs.append(f"""
题目 {i}：
- 类型：{q.type}
- 题目：{q.question}
- 难度：{q.difficulty}
- 参考答案：{q.reference_answer}
- 用户答案：{a}
""")

        qa_str = "\n".join(qa_pairs)

        return f"""你是一个学习掌握度评判专家。根据用户的答案，判断其对当前节点的掌握程度。

当前节点信息：
- 标题：{node.title}
- 描述：{node.description}
- 掌握标准：
{mastery_criteria_str}

测评题和用户答案：
{qa_str}

判定标准：

1. **mastered（掌握）**：
   - 得分 >= 0.8
   - 所有 mastery_criteria 都能体现
   - 答案准确、完整、有深度
   - 能够正确应用知识

2. **review（需复习）**：
   - 得分 0.5-0.8
   - 部分 mastery_criteria 未达标
   - 有明显知识漏洞或误解
   - 基本概念理解但应用不足

3. **learning（需学习）**：
   - 得分 < 0.5
   - 大部分 mastery_criteria 未达标
   - 基础概念不清晰
   - 答案偏离主题或错误较多

评判要求：

1. **对照 mastery_criteria 逐条检查**：
   - 每个标准是否在答案中体现
   - 理解深度是否达到要求

2. **不要过于严格**：
   - 允许表述差异（只要意思正确）
   - 允许部分遗漏（只要核心正确）
   - 关注理解深度，而非死记硬背

3. **给出具体的薄弱点和改进建议**：
   - weak_points: 列出具体的知识漏洞（2-3 条）
   - suggestions: 给出可操作的改进建议（2-3 条）

4. **计算得分**：
   - 根据答案的准确性、完整性、深度综合评分
   - 得分范围：0.0-1.0
   - 保留两位小数

输出要求：
- status: "mastered" | "review" | "learning"
- reasoning: 详细说明判定理由（3-5 句话）
- weak_points: 薄弱点列表（如果有）
- suggestions: 改进建议列表（如果有）
- score: 0.0-1.0 之间的浮点数

示例输出格式：
{{
  "status": "review",
  "reasoning": "你对基础概念理解正确，能够解释简谐振动的三要素。但在应用方面还需加强，对相位的物理意义理解不够深入，未能准确说明相位对振动状态的影响。",
  "weak_points": [
    "相位的物理意义理解不够深入",
    "未能准确说明相位对振动状态的影响"
  ],
  "suggestions": [
    "复习相位的定义，理解相位与初始状态的关系",
    "通过具体例子（如两个相位不同的振动）加深理解"
  ],
  "score": 0.65
}}
"""

    async def process(self, input_data: MasteryJudgeInput) -> MasteryJudgeOutput:
        """执行掌握度判定"""
        # 验证答案数量
        if len(input_data.user_answers) != len(input_data.questions):
            raise ValueError(
                f"Number of answers ({len(input_data.user_answers)}) "
                f"does not match number of questions ({len(input_data.questions)})"
            )

        system_prompt = self.get_system_prompt(input_data)

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": "请判定用户的掌握程度。"},
        ]

        # 调用 LLM 获取结构化输出
        output = await self.llm_client.call_structured(
            messages=messages,
            response_model=MasteryJudgeOutput,
            temperature=self.config.temperature,
            max_tokens=self.config.max_tokens,
            model_override=self.config.model_override,
        )

        # 验证得分和状态的一致性
        if output.score >= 0.8 and output.status != "mastered":
            output.status = "mastered"
        elif output.score < 0.5 and output.status != "learning":
            output.status = "learning"
        elif 0.5 <= output.score < 0.8 and output.status != "review":
            output.status = "review"

        return output
