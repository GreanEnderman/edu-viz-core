from pydantic import BaseModel, Field


class AgentConfig(BaseModel):
    """Agent 配置"""

    # 重试配置
    max_retries: int = Field(default=3, description="最大重试次数")
    retry_delay_base: float = Field(default=2.0, description="重试延迟基数（指数退避）")

    # LLM 配置
    temperature: float = Field(default=0.7, ge=0.0, le=2.0, description="温度参数")
    max_tokens: int | None = Field(default=None, description="最大 token 数")
    model_override: str | None = Field(default=None, description="覆盖默认模型")

    # 日志配置
    log_requests: bool = Field(default=False, description="是否记录完整请求")
    log_responses: bool = Field(default=False, description="是否记录完整响应")

    # 超时配置
    timeout_seconds: int = Field(default=60, description="超时时间（秒）")

    @classmethod
    def from_settings(cls, **overrides) -> "AgentConfig":
        """
        从 Settings 创建配置，支持覆盖
        """
        try:
            from ..core.config import settings

            return cls(
                max_retries=overrides.get("max_retries", settings.AGENT_MAX_RETRIES),
                timeout_seconds=overrides.get(
                    "timeout_seconds", settings.AGENT_TIMEOUT_SECONDS
                ),
                temperature=overrides.get(
                    "temperature", settings.AGENT_DEFAULT_TEMPERATURE
                ),
                **{k: v for k, v in overrides.items() if k not in ["max_retries", "timeout_seconds", "temperature"]},
            )
        except (ImportError, AttributeError):
            # 如果 Settings 中没有 Agent 配置，使用默认值
            return cls(**overrides)
