from abc import ABC, abstractmethod
from typing import TypeVar, Generic, Type
from pydantic import BaseModel, Field
import logging
import time
import uuid

logger = logging.getLogger(__name__)

TInput = TypeVar("TInput", bound=BaseModel)
TOutput = TypeVar("TOutput", bound=BaseModel)


class AgentResult(BaseModel, Generic[TOutput]):
    """Agent 执行结果"""

    success: bool
    data: TOutput | None = None
    error: str | None = None
    metadata: dict = Field(default_factory=dict)

    @property
    def is_success(self) -> bool:
        return self.success and self.data is not None


class AgentError(Exception):
    """Agent 执行错误基类"""

    pass


class AgentValidationError(AgentError):
    """输入/输出校验错误"""

    pass


class AgentLLMError(AgentError):
    """LLM 调用错误"""

    pass


class BaseAgent(ABC, Generic[TInput, TOutput]):
    """
    Agent 基类，所有 Agent 必须继承此类

    子类需要实现：
    - get_input_schema(): 返回输入 Pydantic 模型类
    - get_output_schema(): 返回输出 Pydantic 模型类
    - get_system_prompt(): 返回 system prompt
    - process(): 核心处理逻辑
    """

    def __init__(self, config: "AgentConfig | None" = None):
        from .config import AgentConfig

        self.config = config or AgentConfig()
        self.agent_id = str(uuid.uuid4())
        self.agent_name = self.__class__.__name__

    @abstractmethod
    def get_input_schema(self) -> Type[TInput]:
        """返回输入 schema 类"""
        pass

    @abstractmethod
    def get_output_schema(self) -> Type[TOutput]:
        """返回输出 schema 类"""
        pass

    @abstractmethod
    def get_system_prompt(self, input_data: TInput) -> str:
        """
        返回 system prompt
        可以根据输入动态生成
        """
        pass

    @abstractmethod
    async def process(self, input_data: TInput) -> TOutput:
        """
        核心处理逻辑
        子类实现具体的 LLM 调用和数据处理
        """
        pass

    def validate_input(self, data: dict | TInput) -> TInput:
        """校验输入数据"""
        try:
            if isinstance(data, dict):
                return self.get_input_schema()(**data)
            return data
        except Exception as e:
            raise AgentValidationError(f"Input validation failed: {e}")

    def validate_output(self, data: dict | TOutput) -> TOutput:
        """校验输出数据"""
        try:
            if isinstance(data, dict):
                return self.get_output_schema()(**data)
            return data
        except Exception as e:
            raise AgentValidationError(f"Output validation failed: {e}")

    async def run(self, input_data: dict | TInput) -> AgentResult[TOutput]:
        """
        Agent 入口方法
        处理：输入校验、执行、输出校验、错误处理、日志记录
        """
        start_time = time.time()

        try:
            # 1. 输入校验
            validated_input = self.validate_input(input_data)

            logger.info(
                f"Agent {self.agent_name} started",
                extra={
                    "agent_id": self.agent_id,
                    "agent_name": self.agent_name,
                },
            )

            # 2. 执行处理
            output = await self.process(validated_input)

            # 3. 输出校验
            validated_output = self.validate_output(output)

            # 4. 记录成功
            elapsed = time.time() - start_time
            logger.info(
                f"Agent {self.agent_name} completed successfully",
                extra={
                    "agent_id": self.agent_id,
                    "agent_name": self.agent_name,
                    "elapsed_seconds": elapsed,
                },
            )

            # 5. 记录到数据库
            await self._log_execution(
                input_data=validated_input,
                output_data=validated_output,
                success=True,
                error_message=None,
                elapsed_seconds=elapsed,
            )

            return AgentResult(
                success=True,
                data=validated_output,
                metadata={
                    "agent_id": self.agent_id,
                    "agent_name": self.agent_name,
                    "elapsed_seconds": elapsed,
                },
            )

        except AgentValidationError as e:
            elapsed = time.time() - start_time
            logger.error(
                f"Agent {self.agent_name} validation error: {e}",
                extra={"agent_id": self.agent_id},
            )
            await self._log_execution(
                input_data=input_data if isinstance(input_data, BaseModel) else None,
                output_data=None,
                success=False,
                error_message=f"Validation error: {str(e)}",
                elapsed_seconds=elapsed,
            )
            return AgentResult(
                success=False,
                error=f"Validation error: {str(e)}",
                metadata={"agent_id": self.agent_id, "error_type": "validation"},
            )

        except AgentLLMError as e:
            elapsed = time.time() - start_time
            logger.error(
                f"Agent {self.agent_name} LLM error: {e}",
                extra={"agent_id": self.agent_id},
            )
            await self._log_execution(
                input_data=input_data if isinstance(input_data, BaseModel) else None,
                output_data=None,
                success=False,
                error_message=f"LLM error: {str(e)}",
                elapsed_seconds=elapsed,
            )
            return AgentResult(
                success=False,
                error=f"LLM error: {str(e)}",
                metadata={"agent_id": self.agent_id, "error_type": "llm"},
            )

        except Exception as e:
            elapsed = time.time() - start_time
            logger.exception(
                f"Agent {self.agent_name} unexpected error: {e}",
                extra={"agent_id": self.agent_id},
            )
            await self._log_execution(
                input_data=input_data if isinstance(input_data, BaseModel) else None,
                output_data=None,
                success=False,
                error_message=f"Unexpected error: {str(e)}",
                elapsed_seconds=elapsed,
            )
            return AgentResult(
                success=False,
                error=f"Unexpected error: {str(e)}",
                metadata={"agent_id": self.agent_id, "error_type": "unknown"},
            )

    async def _log_execution(
        self,
        input_data: BaseModel | None,
        output_data: BaseModel | None,
        success: bool,
        error_message: str | None,
        elapsed_seconds: float,
    ) -> None:
        """记录 Agent 执行到数据库"""
        try:
            from .logger import log_agent_execution

            await log_agent_execution(
                agent_id=self.agent_id,
                agent_name=self.agent_name,
                input_data=input_data.model_dump() if input_data else {},
                output_data=output_data.model_dump() if output_data else None,
                success=success,
                error_message=error_message,
                elapsed_seconds=elapsed_seconds,
            )
        except Exception as e:
            logger.warning(f"Failed to log agent execution to database: {e}")
