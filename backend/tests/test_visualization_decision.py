"""
测试 AI 可视化决策能力
用法：cd 项目根目录 → python backend/tests/test_visualization_decision.py
"""
import asyncio
import json
from backend.app.orchestrator.prompt_builder import build_system_prompt
from backend.app.services.llm import stream_chat


TEST_QUERIES = [
    ("什么是光合作用", "纯文本（定义类，无需可视化）"),
    ("解释食物链的结构", "Mermaid（静态层次关系）"),
    ("展示振幅为5的简谐运动", "A2UI 组件（参数探索）"),
    ("牛顿第二定律 F=ma 怎么用", "A2UI Slider+Text（参数探索）"),
    ("能量转化的过程是什么", "混合或 Mermaid（流程关系）"),
    ("做个小测验考考我关于力的知识", "A2UI MultipleChoice（测验）"),
]


async def test_single_query(query: str, expected: str) -> None:
    system_prompt = build_system_prompt()
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": query},
    ]

    full_response = ""
    async for chunk in stream_chat(messages):
        full_response += chunk

    # 判断使用了什么可视化方式
    has_a2ui = '"surfaceUpdate"' in full_response or "'surfaceUpdate'" in full_response
    has_mermaid = "```mermaid" in full_response

    if has_a2ui and has_mermaid:
        method = "混合（A2UI + Mermaid）"
    elif has_a2ui:
        method = "A2UI 组件"
    elif has_mermaid:
        method = "Mermaid 图表"
    else:
        method = "纯文本"

    match = "✓" if method in expected or expected.startswith(method[:2]) else "?"

    print(f"\n{'='*60}")
    print(f"问题：{query}")
    print(f"期望：{expected}")
    print(f"实际：{method} {match}")
    print(f"{'='*60}")
    # 打印前 300 字预览
    preview = full_response[:300].replace("\n", "\\n")
    print(f"预览：{preview}...")


async def main():
    print("=" * 60)
    print("AI 可视化决策测试")
    print("=" * 60)
    print(f"\n提示词长度：{len(build_system_prompt())} 字符\n")

    for query, expected in TEST_QUERIES:
        try:
            await test_single_query(query, expected)
        except Exception as e:
            print(f"\n❌ 测试失败 [{query}]：{e}")

    print("\n\n测试完成！")


if __name__ == "__main__":
    asyncio.run(main())
