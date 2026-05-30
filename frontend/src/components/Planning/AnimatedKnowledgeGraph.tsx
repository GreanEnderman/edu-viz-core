/**
 * 增强版知识图谱 - 带有优雅的生成动画
 * 使用 Framer Motion 实现有机生长效果
 */

import { motion } from 'framer-motion'
import type { KnowledgeNode } from '../../types/appFlow'

interface AnimatedKnowledgeGraphProps {
  nodes: KnowledgeNode[]
  isGenerating?: boolean
}

export function AnimatedKnowledgeGraph({ nodes, isGenerating = false }: AnimatedKnowledgeGraphProps) {
  // 计算连线路径
  const getConnections = () => {
    const connections: Array<{
      id: string
      x1: number
      y1: number
      x2: number
      y2: number
      delay: number
    }> = []

    nodes.forEach((node, nodeIndex) => {
      node.connections.forEach((targetId) => {
        const target = nodes.find((n) => n.id === targetId)
        if (target) {
          const targetIndex = nodes.findIndex((n) => n.id === targetId)
          connections.push({
            id: `${node.id}-${targetId}`,
            x1: node.position.x,
            y1: node.position.y,
            x2: target.position.x,
            y2: target.position.y,
            delay: Math.max(nodeIndex, targetIndex) * 0.15,
          })
        }
      })
    })

    return connections
  }

  const connections = getConnections()

  return (
    <div className="w-full h-full flex items-center justify-center">
      <svg
        width="600"
        height="500"
        viewBox="0 0 600 500"
        className="max-w-full"
      >
        {/* 背景光晕效果 */}
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#775a19" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#775a19" stopOpacity="0" />
          </radialGradient>

          {/* 金色光晕（用于中心节点） */}
          <filter id="golden-glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 连线层 - 路径绘制动画 */}
        <g>
          {connections.map((conn) => (
            <motion.line
              key={conn.id}
              x1={conn.x1}
              y1={conn.y1}
              x2={conn.x2}
              y2={conn.y2}
              stroke="#c5c6cf"
              strokeWidth="1.5"
              strokeDasharray="4 4"
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 0.3 }}
              transition={{
                pathLength: { duration: 0.8, delay: conn.delay, ease: 'easeInOut' },
                opacity: { duration: 0.3, delay: conn.delay },
              }}
            />
          ))}
        </g>

        {/* 节点层 - 弹性生长动画 */}
        <g>
          {nodes.map((node, index) => {
            const isCenter = node.id === 'center'
            const radius = isCenter ? 48 : 32

            return (
              <motion.g
                key={node.id}
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: index * 0.15,
                  duration: 0.6,
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                }}
              >
                {/* 背景光晕（仅中心节点） */}
                {isCenter && (
                  <motion.circle
                    cx={node.position.x}
                    cy={node.position.y}
                    r={radius + 20}
                    fill="url(#glow)"
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{
                      delay: index * 0.15 + 0.3,
                      duration: 1,
                      repeat: Infinity,
                      repeatType: 'reverse',
                    }}
                  />
                )}

                {/* 节点圆形 */}
                <motion.circle
                  cx={node.position.x}
                  cy={node.position.y}
                  r={radius}
                  fill={isCenter ? '#775a19' : '#ffffff'}
                  stroke={isCenter ? '#775a19' : '#c5c6cf'}
                  strokeWidth="2"
                  filter={isCenter ? 'url(#golden-glow)' : undefined}
                  style={{
                    filter: isCenter
                      ? undefined
                      : 'drop-shadow(0px 4px 12px rgba(27, 28, 26, 0.08))',
                  }}
                  whileHover={{
                    scale: 1.1,
                    transition: { duration: 0.2 },
                  }}
                  className="cursor-pointer"
                />

                {/* 节点文字 */}
                <motion.text
                  x={node.position.x}
                  y={node.position.y}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  className="font-sans font-medium pointer-events-none select-none"
                  fill={isCenter ? '#ffffff' : '#1b1c1a'}
                  fontSize={isCenter ? '16' : '14'}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{
                    delay: index * 0.15 + 0.3,
                    duration: 0.4,
                  }}
                >
                  {node.label}
                </motion.text>

                {/* 状态指示器 */}
                {node.status === 'completed' && (
                  <motion.circle
                    cx={node.position.x + radius - 8}
                    cy={node.position.y - radius + 8}
                    r="6"
                    fill="#775a19"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{
                      delay: index * 0.15 + 0.5,
                      type: 'spring',
                      stiffness: 300,
                    }}
                  />
                )}

                {node.status === 'in_progress' && (
                  <motion.circle
                    cx={node.position.x + radius - 8}
                    cy={node.position.y - radius + 8}
                    r="6"
                    fill="#182544"
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{
                      delay: index * 0.15 + 0.5,
                      duration: 1.5,
                      repeat: Infinity,
                    }}
                  />
                )}
              </motion.g>
            )
          })}
        </g>

        {/* 生成中的加载提示 */}
        {isGenerating && (
          <motion.text
            x="300"
            y="480"
            textAnchor="middle"
            className="font-sans text-sm text-on-surface-variant"
            initial={{ opacity: 0 }}
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{
              duration: 2,
              repeat: Infinity,
            }}
          >
            正在构建学习路径...
          </motion.text>
        )}
      </svg>
    </div>
  )
}
