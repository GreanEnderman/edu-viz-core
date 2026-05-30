/**
 * 知识图谱可视化组件
 * 使用 SVG 绘制节点和连线，展示学习路径
 */

import { useEffect, useState } from 'react'
import type { KnowledgeNode } from '../../types/appFlow'

interface KnowledgeGraphProps {
  nodes: KnowledgeNode[]
}

export function KnowledgeGraph({ nodes }: KnowledgeGraphProps) {
  const [visibleNodes, setVisibleNodes] = useState<string[]>([])

  // 节点逐个淡入动画
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = []
    nodes.forEach((node, index) => {
      const timer = setTimeout(() => {
        setVisibleNodes((prev) => [...prev, node.id])
      }, index * 300)
      timers.push(timer)
    })

    return () => timers.forEach((timer) => clearTimeout(timer))
  }, [nodes])

  // 绘制连线
  const renderConnections = () => {
    const lines: JSX.Element[] = []
    nodes.forEach((node) => {
      node.connections.forEach((targetId) => {
        const target = nodes.find((n) => n.id === targetId)
        if (target && visibleNodes.includes(node.id) && visibleNodes.includes(targetId)) {
          lines.push(
            <line
              key={`${node.id}-${targetId}`}
              x1={node.position.x}
              y1={node.position.y}
              x2={target.position.x}
              y2={target.position.y}
              stroke="#c5c6cf"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              opacity="0.3"
              className="transition-opacity duration-500"
            />
          )
        }
      })
    })
    return lines
  }

  // 绘制节点
  const renderNodes = () => {
    return nodes.map((node) => {
      const isVisible = visibleNodes.includes(node.id)
      const isCenter = node.id === 'center'

      return (
        <g
          key={node.id}
          transform={`translate(${node.position.x}, ${node.position.y})`}
          className={`transition-opacity duration-500 ${
            isVisible ? 'opacity-100' : 'opacity-0'
          }`}
        >
          {/* 节点圆形背景 */}
          <circle
            cx="0"
            cy="0"
            r={isCenter ? '48' : '32'}
            fill={isCenter ? '#775a19' : '#ffffff'}
            stroke={isCenter ? '#775a19' : '#c5c6cf'}
            strokeWidth="2"
            className="hover-lift transition-all duration-300 cursor-pointer"
            style={{
              filter: 'drop-shadow(0px 4px 12px rgba(27, 28, 26, 0.08))',
            }}
          />

          {/* 节点文字 */}
          <text
            x="0"
            y="0"
            textAnchor="middle"
            dominantBaseline="middle"
            className="font-sans font-medium pointer-events-none"
            fill={isCenter ? '#ffffff' : '#1b1c1a'}
            fontSize={isCenter ? '16' : '14'}
          >
            {node.label}
          </text>

          {/* 节点标签（仅中心节点） */}
          {isCenter && (
            <text
              x="0"
              y="70"
              textAnchor="middle"
              className="font-sans text-sm font-medium pointer-events-none"
              fill="#1b1c1a"
            >
              {node.label}
            </text>
          )}
        </g>
      )
    })
  }

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        width="600"
        height="500"
        viewBox="0 0 600 500"
        className="max-w-full"
      >
        {/* 连线层 */}
        <g>{renderConnections()}</g>

        {/* 节点层 */}
        <g>{renderNodes()}</g>
      </svg>
    </div>
  )
}
