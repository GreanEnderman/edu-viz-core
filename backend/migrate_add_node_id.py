"""
数据库迁移脚本：为 messages 表添加 node_id 字段
"""
import sqlite3
import sys
from pathlib import Path

# 数据库路径
DB_PATH = Path(__file__).parent.parent / "data" / "aha_tutor.db"


def migrate():
    """执行迁移"""
    print(f"连接数据库: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        # 检查 node_id 字段是否已存在
        cursor.execute("PRAGMA table_info(messages)")
        columns = [row[1] for row in cursor.fetchall()]

        if "node_id" in columns:
            print("[OK] node_id 字段已存在，无需迁移")
            return

        print("开始迁移...")

        # 添加 node_id 字段
        print("1. 添加 node_id 字段...")
        cursor.execute("""
            ALTER TABLE messages
            ADD COLUMN node_id TEXT
        """)

        # 创建索引
        print("2. 创建索引 idx_messages_node_id...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_messages_node_id ON messages(node_id)
        """)

        print("3. 创建索引 idx_messages_conversation_node...")
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_messages_conversation_node
            ON messages(conversation_id, node_id)
        """)

        # 提交更改
        conn.commit()
        print("[OK] 迁移成功完成！")

        # 验证结果
        print("\n验证结果:")
        cursor.execute("PRAGMA table_info(messages)")
        columns = cursor.fetchall()
        print("messages 表结构:")
        for col in columns:
            print(f"  - {col[1]} ({col[2]})")

        cursor.execute("PRAGMA index_list(messages)")
        indexes = cursor.fetchall()
        print("\nmessages 表索引:")
        for idx in indexes:
            print(f"  - {idx[1]}")

    except Exception as e:
        print(f"[ERROR] 迁移失败: {e}")
        conn.rollback()
        sys.exit(1)
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
