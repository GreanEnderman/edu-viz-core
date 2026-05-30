import json
import uuid
from datetime import datetime

from ..db import get_db


async def log_agent_execution(
    agent_id: str,
    agent_name: str,
    input_data: dict,
    output_data: dict | None,
    success: bool,
    error_message: str | None,
    elapsed_seconds: float,
) -> None:
    """
    记录 Agent 执行到数据库

    Args:
        agent_id: Agent 实例 ID
        agent_name: Agent 类名
        input_data: 输入数据（字典）
        output_data: 输出数据（字典，可选）
        success: 是否成功
        error_message: 错误消息（可选）
        elapsed_seconds: 执行耗时（秒）
    """
    db = get_db()

    log_id = str(uuid.uuid4())
    created_at = datetime.utcnow().isoformat()

    await db.execute(
        """
        INSERT INTO agent_logs (
            id, agent_name, input_data, output_data, success, error_message, elapsed_seconds, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            log_id,
            agent_name,
            json.dumps(input_data, ensure_ascii=False),
            json.dumps(output_data, ensure_ascii=False) if output_data else None,
            1 if success else 0,
            error_message,
            elapsed_seconds,
            created_at,
        ),
    )
    await db.commit()
