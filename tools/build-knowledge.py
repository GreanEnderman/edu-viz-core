"""
知识库构建工具

用法：
    python tools/build-knowledge.py --input <docs_dir> --output <output_path>

将 docs_dir 下的 .md / .txt 文件分块后存入 SQLite 向量数据库。
当前版本使用 SQLite 存储 + 简单文本检索（BM25 占位），
M5 阶段将替换为正式的向量嵌入方案。
"""

import argparse
import os
import re
import sqlite3
import sys
from pathlib import Path


def split_into_chunks(text: str, chunk_size: int = 500, overlap: int = 50) -> list[str]:
    """Split text into overlapping chunks by paragraphs."""
    paragraphs = re.split(r'\n\s*\n', text)
    chunks: list[str] = []
    current = ""

    for para in paragraphs:
        para = para.strip()
        if not para:
            continue
        if len(current) + len(para) > chunk_size and current:
            chunks.append(current.strip())
            # keep overlap from end of current chunk
            if overlap > 0 and len(current) > overlap:
                current = current[-overlap:] + "\n\n" + para
            else:
                current = para
        else:
            current += "\n\n" + para

    if current.strip():
        chunks.append(current.strip())

    return chunks


def build_knowledge_base(input_dir: str, output_path: str) -> int:
    """Read documents, chunk them, and store in SQLite."""
    input_path = Path(input_dir)
    if not input_path.exists():
        print(f"Error: input directory '{input_dir}' does not exist", file=sys.stderr)
        return 0

    supported_ext = {'.md', '.txt'}
    files = [f for f in input_path.iterdir() if f.is_file() and f.suffix.lower() in supported_ext]

    if not files:
        print(f"Error: no .md or .txt files found in '{input_dir}'", file=sys.stderr)
        return 0

    os.makedirs(os.path.dirname(output_path) or '.', exist_ok=True)

    # remove existing db
    if os.path.exists(output_path):
        os.remove(output_path)

    conn = sqlite3.connect(output_path)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS chunks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_file TEXT NOT NULL,
            chunk_index INTEGER NOT NULL,
            content TEXT NOT NULL
        )
    """)
    cursor.execute("""
        CREATE VIRTUAL TABLE IF NOT EXISTS chunks_fts USING fts5(
            content,
            source_file,
            content='chunks',
            content_rowid='id'
        )
    """)

    total_chunks = 0
    for filepath in files:
        text = filepath.read_text(encoding='utf-8')
        chunks = split_into_chunks(text)
        for i, chunk in enumerate(chunks):
            cursor.execute(
                "INSERT INTO chunks (source_file, chunk_index, content) VALUES (?, ?, ?)",
                (filepath.name, i, chunk),
            )
            total_chunks += 1
        print(f"  {filepath.name}: {len(chunks)} chunks")

    conn.commit()
    conn.close()
    return total_chunks


def main() -> None:
    parser = argparse.ArgumentParser(description='Build knowledge base from documents')
    parser.add_argument('--input', required=True, help='Input directory containing .md/.txt files')
    parser.add_argument('--output', required=True, help='Output path for vector.db')
    args = parser.parse_args()

    print(f"Building knowledge base from: {args.input}")
    total = build_knowledge_base(args.input, args.output)
    if total > 0:
        print(f"Done: {total} chunks stored in {args.output}")
    else:
        sys.exit(1)


if __name__ == '__main__':
    main()
