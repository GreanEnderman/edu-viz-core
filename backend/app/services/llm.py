from typing import AsyncIterator

from openai import AsyncOpenAI

from backend.app.core.config import settings

_client: AsyncOpenAI | None = None


def _get_client() -> AsyncOpenAI:
    global _client
    if _client is None:
        _client = AsyncOpenAI(
            api_key=settings.LLM_API_KEY,
            base_url=settings.LLM_BASE_URL,
        )
    return _client


async def stream_chat(messages: list[dict]) -> AsyncIterator[str]:
    client = _get_client()
    stream = await client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=messages,
        stream=True,
    )
    async for chunk in stream:
        content = chunk.choices[0].delta.content
        if content:
            yield content


async def generate_title(user_message: str, assistant_message: str) -> str:
    """根据首轮对话内容生成简短标题（≤10 字）。"""
    client = _get_client()
    response = await client.chat.completions.create(
        model=settings.LLM_MODEL,
        messages=[
            {
                "role": "system",
                "content": "根据以下对话内容生成一个简短的中文标题，不超过10个字，不要加引号或标点。只输出标题文本，不要任何额外内容。",
            },
            {
                "role": "user",
                "content": f"用户：{user_message}\n助手：{assistant_message[:500]}",
            },
        ],
        max_tokens=30,
    )
    return response.choices[0].message.content.strip()
