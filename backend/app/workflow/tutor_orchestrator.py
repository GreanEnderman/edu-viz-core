"""Coordinate tutor content with optional A2UI visualization streaming."""

import asyncio
import json
import logging
from typing import AsyncIterator

from ..agents.tutor import TutorAgent, TutorAgentInput
from ..agents.visualizer import VisualizerAgent, VisualizerAgentInput, VisualizerAgentOutput
from ..learning.prompt_context import build_pbl_chat_context
from ..learning.schemas import LearningNode, LearningWorkflowState
from ..orchestrator.a2ui_builder import is_a2ui_line
from ..orchestrator.prompt_builder import build_pbl_system_prompt, get_plugin_capabilities_for_user
from ..services.llm import stream_chat
from ..services.streaming import emit_line

logger = logging.getLogger(__name__)


class TutorOrchestrator:
    """Stream teaching text and, when appropriate, a renderable A2UI surface."""

    def __init__(self):
        self.tutor_agent = TutorAgent()
        self.visualizer_agent = VisualizerAgent()

    async def teach_streaming(
        self,
        workflow_state: LearningWorkflowState,
        current_node: LearningNode,
        user_message: str,
        conversation_history: list[dict],
    ) -> AsyncIterator[str]:
        try:
            logger.info("Calling TutorAgent for node %s", current_node.id)
            tutor_result = await self.tutor_agent.run(
                TutorAgentInput(
                    workflow_state=workflow_state,
                    current_node=current_node,
                    user_message=user_message,
                    conversation_history=conversation_history,
                )
            )

            if not tutor_result.is_success:
                logger.warning(
                    "TutorAgent failed: %s, falling back to generic LLM",
                    tutor_result.error,
                )
                async for chunk in self._fallback_to_generic_llm(
                    workflow_state, user_message, conversation_history
                ):
                    yield chunk
                return

            tutor_output = tutor_result.data

            for line in tutor_output.content.split("\n"):
                yield self._emit_text(line + "\n")
                await asyncio.sleep(0.01)

            if tutor_output.should_visualize:
                viz_output = await self._handle_visualization(
                    tutor_output, current_node, workflow_state
                )
                viz_context = tutor_output.visualization_context
                if viz_context:
                    concept = viz_context.get("concept", current_node.title)
                    reason = viz_context.get("reason", "帮助理解当前概念")
                    yield self._emit_text(f"\n\n💡 **可视化建议**: {concept} - {reason}\n")

                    suggested_components = viz_context.get("suggested_components", [])
                    if suggested_components:
                        components_str = "、".join(suggested_components)
                        yield self._emit_text(f"推荐组件: {components_str}\n")

                if not viz_output or viz_output.visualization_type == "a2ui":
                    async for event in self._stream_a2ui_visualization(
                        tutor_output=tutor_output,
                        current_node=current_node,
                        workflow_state=workflow_state,
                    ):
                        yield event

            if tutor_output.next_action_suggestion:
                yield self._emit_text(f"\n\n**下一步**: {tutor_output.next_action_suggestion}\n")

        except Exception as e:
            logger.error("TutorOrchestrator error: %s", e, exc_info=True)
            yield self._emit_error(f"教学过程出错: {str(e)}")

    async def _handle_visualization(
        self,
        tutor_output,
        current_node: LearningNode,
        workflow_state: LearningWorkflowState,
    ) -> VisualizerAgentOutput | None:
        try:
            logger.info("Calling VisualizerAgent for node %s", current_node.id)
            plugin_caps = await get_plugin_capabilities_for_user("default")
            viz_result = await self.visualizer_agent.run(
                VisualizerAgentInput(
                    current_node=current_node,
                    tutor_context=tutor_output.content[:500],
                    plugin_capabilities=plugin_caps,
                    available_components=[],
                )
            )

            if not viz_result.is_success:
                logger.warning("VisualizerAgent failed: %s", viz_result.error)
                return None

            viz_output = viz_result.data
            logger.info(
                "Visualization decision: should_visualize=%s, type=%s",
                viz_output.should_visualize,
                viz_output.visualization_type,
            )
            return viz_output

        except Exception as e:
            logger.error("Visualization handling error: %s", e, exc_info=True)
            return None

    async def _stream_a2ui_visualization(
        self,
        tutor_output,
        current_node: LearningNode,
        workflow_state: LearningWorkflowState,
    ) -> AsyncIterator[str]:
        """Ask the LLM for A2UI JSONL and emit only valid A2UI SSE events."""
        plugin_caps = await get_plugin_capabilities_for_user("default")
        pbl_context = build_pbl_chat_context(workflow_state)
        system_prompt = build_pbl_system_prompt(
            pbl_context,
            plugin_capabilities=plugin_caps,
        )
        viz_context = tutor_output.visualization_context or {}
        suggested_components = viz_context.get("suggested_components", [])
        component_hints = sorted(set([*current_node.component_hints, *suggested_components]))

        user_prompt = f"""请为当前 PBL 学习页生成一个可直接渲染的 A2UI v0.8 可视化。

要求：
- 只输出 A2UI JSONL；每一行必须是一个合法 JSON 对象。
- 不要使用 Markdown 代码块，不要解释 JSON。
- surfaceId 使用 "main"，前端会自动映射到学习页 surface。
- 消息顺序使用：surfaceUpdate，然后 dataModelUpdate（如需要），最后 beginRendering。
- 优先使用这些推荐组件：{", ".join(component_hints) if component_hints else "根据可用插件能力自行选择"}。
- 如果使用插件组件，只传入 manifest 里声明的 properties，不要额外生成重复控制器。

教学内容：
{tutor_output.content[:1200]}

可视化目标：
{viz_context.get("concept", current_node.title)} - {viz_context.get("reason", "帮助学生通过交互理解当前节点")}
"""

        messages = [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ]

        buffer = ""
        async for chunk in stream_chat(messages):
            buffer += chunk
            lines = buffer.split("\n")
            buffer = lines[-1]
            for line in lines[:-1]:
                stripped = line.strip()
                if stripped and is_a2ui_line(stripped):
                    yield emit_line(stripped)

        stripped = buffer.strip()
        if stripped and is_a2ui_line(stripped):
            yield emit_line(stripped)

    async def _fallback_to_generic_llm(
        self,
        workflow_state: LearningWorkflowState,
        user_message: str,
        conversation_history: list[dict],
    ) -> AsyncIterator[str]:
        try:
            pbl_context = build_pbl_chat_context(workflow_state)
            plugin_caps = await get_plugin_capabilities_for_user("default")
            system_prompt = build_pbl_system_prompt(
                pbl_context,
                plugin_capabilities=plugin_caps,
            )

            messages = [{"role": "system", "content": system_prompt}]
            messages.extend(conversation_history[-5:])
            messages.append({"role": "user", "content": user_message})

            async for chunk in stream_chat(messages):
                if chunk:
                    yield self._emit_text(chunk)

        except Exception as e:
            logger.error("Fallback LLM error: %s", e, exc_info=True)
            yield self._emit_error(f"生成回复失败: {str(e)}")

    def _emit_text(self, text: str) -> str:
        return f"data: {json.dumps({'type': 'text', 'content': text}, ensure_ascii=False)}\n\n"

    def _emit_error(self, message: str) -> str:
        return f"data: {json.dumps({'type': 'error', 'message': message}, ensure_ascii=False)}\n\n"
