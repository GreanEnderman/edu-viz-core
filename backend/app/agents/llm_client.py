import json
import logging
from typing import Type, AsyncIterator
from openai import AsyncOpenAI, RateLimitError, APITimeoutError
from pydantic import BaseModel
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
)

from ..core.config import settings
from .base import AgentLLMError

logger = logging.getLogger(__name__)

_client: AsyncOpenAI | None = None


def get_llm_client() -> AsyncOpenAI:
    """获取 OpenAI 客户端单例"""
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.LLM_API_KEY,
            base_url=settings.LLM_BASE_URL,
        )
    return _client


class LLMClient:
    """
    统一的 LLM 调用层
    提供结构化输出、重试、日志记录
    """

    def __init__(self, max_retries: int = 3, retry_delay_base: float = 2.0):
        self.client = get_llm_client()
        self.max_retries = max_retries
        self.retry_delay_base = retry_delay_base

    async def call_structured(
        self,
        messages: list[dict],
        response_model: Type[BaseModel],
        temperature: float = 0.7,
        max_tokens: int | None = None,
        model_override: str | None = None,
    ) -> BaseModel:
        """
        调用 LLM 并返回结构化输出

        Args:
            messages: 消息列表
            response_model: 期望的输出 Pydantic 模型
            temperature: 温度参数
            max_tokens: 最大 token 数
            model_override: 覆盖默认模型

        Returns:
            response_model 的实例

        Raises:
            AgentLLMError: LLM 调用失败
        """
        model = model_override or settings.LLM_MODEL

        # 在 system message 中添加 JSON schema 说明
        schema_instruction = self._build_schema_instruction(response_model)
        messages = self._inject_schema_instruction(messages, schema_instruction)

        try:
            response = await self._call_with_retry(
                messages=messages,
                temperature=temperature,
                max_tokens=max_tokens,
                model=model,
            )

            # 解析 JSON 并校验
            content = response.choices[0].message.content
            if not content:
                raise AgentLLMError("LLM returned empty content")

            try:
                data = json.loads(content)
            except json.JSONDecodeError as e:
                logger.error(f"Failed to parse LLM output as JSON: {content[:200]}")
                raise AgentLLMError(f"Invalid JSON output: {e}")

            # 使用 Pydantic 校验
            try:
                return response_model(**data)
            except Exception as e:
                logger.error(f"Failed to validate LLM output: {data}")
                raise AgentLLMError(f"Output validation failed: {e}")

        except (RateLimitError, APITimeoutError) as e:
            raise AgentLLMError(f"LLM API error: {e}")
        except Exception as e:
            if isinstance(e, AgentLLMError):
                raise
            raise AgentLLMError(f"Unexpected error: {e}")

    @retry(
        stop=stop_after_attempt(3),
        wait=wait_exponential(multiplier=2, min=1, max=10),
        retry=retry_if_exception_type((RateLimitError, APITimeoutError)),
    )
    async def _call_with_retry(
        self,
        messages: list[dict],
        temperature: float,
        max_tokens: int | None,
        model: str,
    ):
        """带重试的 LLM 调用"""
        logger.debug(f"Calling LLM with model={model}, temperature={temperature}")

        response = await self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            max_tokens=max_tokens,
            response_format={"type": "json_object"},  # 强制 JSON 输出
        )

        logger.debug(
            f"LLM call completed",
            extra={
                "usage": response.usage.model_dump() if response.usage else None,
            },
        )

        return response

    async def call_streaming(
        self,
        messages: list[dict],
        temperature: float = 0.7,
        model_override: str | None = None,
    ) -> AsyncIterator[str]:
        """
        流式调用 LLM（保留兼容性）
        用于现有的 chat 功能
        """
        model = model_override or settings.LLM_MODEL

        stream = await self.client.chat.completions.create(
            model=model,
            messages=messages,
            temperature=temperature,
            stream=True,
        )

        async for chunk in stream:
            content = chunk.choices[0].delta.content
            if content:
                yield content

    def _build_schema_instruction(self, model: Type[BaseModel]) -> str:
        """构建 JSON schema 说明"""
        schema = model.model_json_schema()

        # 提取字段说明
        properties = schema.get("properties", {})
        required = schema.get("required", [])

        fields_desc = []
        for field_name, field_info in properties.items():
            field_type = field_info.get("type", "any")
            is_required = field_name in required
            desc = field_info.get("description", "")

            field_line = f"  - {field_name} ({field_type})"
            if is_required:
                field_line += " [必填]"
            if desc:
                field_line += f": {desc}"
            fields_desc.append(field_line)

        instruction = f"""
你必须以 JSON 格式输出，严格遵守以下 schema：

字段说明：
{chr(10).join(fields_desc)}

示例格式：
{json.dumps(self._generate_example(model), ensure_ascii=False, indent=2)}

重要：
1. 只输出 JSON，不要包含任何其他文本
2. 所有必填字段都必须提供
3. 字段类型必须匹配
"""
        return instruction

    def _inject_schema_instruction(
        self, messages: list[dict], schema_instruction: str
    ) -> list[dict]:
        """将 schema 说明注入到 system message"""
        new_messages = []
        for msg in messages:
            if msg["role"] == "system":
                # 在 system message 末尾添加 schema 说明
                new_content = msg["content"] + "\n\n" + schema_instruction
                new_messages.append({"role": "system", "content": new_content})
            else:
                new_messages.append(msg)
        return new_messages

    def _generate_example(self, model: Type[BaseModel]) -> dict:
        """生成示例 JSON（使用默认值或占位符）"""
        schema = model.model_json_schema()
        properties = schema.get("properties", {})

        example = {}
        for field_name, field_info in properties.items():
            field_type = field_info.get("type")
            if field_type == "string":
                example[field_name] = "示例文本"
            elif field_type == "integer":
                example[field_name] = 0
            elif field_type == "number":
                example[field_name] = 0.0
            elif field_type == "boolean":
                example[field_name] = False
            elif field_type == "array":
                example[field_name] = []
            elif field_type == "object":
                example[field_name] = {}
            else:
                example[field_name] = None

        return example
