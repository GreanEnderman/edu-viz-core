/**
 * 基于 react-d3-tree 的知识图谱组件
 * 以树形结构展示学习路径，并尽量保持交互流畅。
 */

import { useCallback, useMemo, useState } from 'react'
import Tree from 'react-d3-tree'
import { motion } from 'framer-motion'
import type { RawNodeDatum, TreeNodeDatum } from 'react-d3-tree'
import type { KnowledgeNode } from '../../types/appFlow'

interface D3KnowledgeGraphProps {
  nodes: KnowledgeNode[]
  isGenerating?: boolean
}

function buildD3TreeData(nodes: KnowledgeNode[]): RawNodeDatum {
  if (nodes.length === 0) {
    return { name: '暂无数据', children: [] }
  }

  const nodeMap = new Map<string, RawNodeDatum>()

  nodes.forEach((node) => {
    nodeMap.set(node.id, {
      name: node.label,
      attributes: {
        id: node.id,
        status: node.status || 'pending',
      },
      children: [],
    })
  })

  let root: RawNodeDatum | null = null

  nodes.forEach((node) => {
    const d3Node = nodeMap.get(node.id)
    if (!d3Node) {
      return
    }

    node.connections.forEach((childId) => {
      const child = nodeMap.get(childId)
      if (child) {
        d3Node.children!.push(child)
      }
    })

    const isRoot = !nodes.some((candidate) => candidate.connections.includes(node.id))
    if (isRoot) {
      root = d3Node
    }
  })

  return root || { name: '暂无数据', children: [] }
}

export function D3KnowledgeGraph({ nodes, isGenerating = false }: D3KnowledgeGraphProps) {
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 })

  const containerRef = useCallback((el: HTMLDivElement | null) => {
    if (!el) {
      return
    }

    const rect = el.getBoundingClientRect()
    setDimensions((current) => {
      if (current.width === rect.width && current.height === rect.height) {
        return current
      }

      return { width: rect.width, height: rect.height }
    })
  }, [])

  const translate = useMemo(
    () => ({
      x: dimensions.width / 2,
      y: 80,
    }),
    [dimensions.height, dimensions.width]
  )

  const treeData = useMemo(() => buildD3TreeData(nodes), [nodes])
  const rootName = treeData.name

  const renderCustomNode = useCallback(
    ({ nodeDatum }: { nodeDatum: TreeNodeDatum }) => {
      const status = String(nodeDatum.attributes?.status || 'pending')
      const nodeId = String(nodeDatum.attributes?.id || '')
      const isRoot = rootName === nodeDatum.name

      const nodeColor = (() => {
        if (isRoot) {
          return '#775a19'
        }

        switch (status) {
          case 'completed':
            return '#775a19'
          case 'in_progress':
            return '#182544'
          default:
            return '#ffffff'
        }
      })()

      const textColor =
        isRoot || status === 'completed' || status === 'in_progress' ? '#ffffff' : '#1b1c1a'

      const width = isRoot ? 200 : 180
      const height = isRoot ? 90 : 80
      const rx = 30

      return (
        <g className="graph-node" data-node-id={nodeId}>
          {isRoot && (
            <rect
              x={-width / 2 - 12}
              y={-height / 2 - 12}
              width={width + 24}
              height={height + 24}
              rx={rx + 12}
              fill="url(#glow)"
              opacity="0.3"
              pointerEvents="none"
            />
          )}

          <rect
            className="graph-node__shape"
            x={-width / 2}
            y={-height / 2}
            width={width}
            height={height}
            rx={rx}
            fill={nodeColor}
            stroke={nodeColor === '#ffffff' ? '#c5c6cf' : nodeColor}
            strokeWidth="2"
            style={{
              filter: 'drop-shadow(0px 4px 12px rgba(27, 28, 26, 0.08))',
            }}
          />

          <foreignObject
            x={-width / 2 + 12}
            y={-height / 2 + 8}
            width={width - 24}
            height={height - 16}
            pointerEvents="none"
          >
            <div
              style={{
                width: '100%',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontFamily: 'Manrope, sans-serif',
                fontSize: isRoot ? '14px' : '13px',
                fontWeight: 500,
                color: textColor,
                textAlign: 'center',
                lineHeight: '1.4',
                wordWrap: 'break-word',
                overflowWrap: 'break-word',
                hyphens: 'auto',
                padding: '4px',
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            >
              {nodeDatum.name}
            </div>
          </foreignObject>

          {status === 'completed' && !isRoot && (
            <circle
              cx={width / 2 - 16}
              cy={-height / 2 + 12}
              r="6"
              fill="#775a19"
              pointerEvents="none"
            />
          )}

          {status === 'in_progress' && !isRoot && (
            <circle
              cx={width / 2 - 16}
              cy={-height / 2 + 12}
              r="6"
              fill="#182544"
              pointerEvents="none"
            >
              <animate
                attributeName="r"
                values="6;8;6"
                dur="1.5s"
                repeatCount="indefinite"
              />
            </circle>
          )}
        </g>
      )
    },
    [rootName]
  )

  return (
    <div className="w-full h-[500px] relative" ref={containerRef}>
      <svg width="0" height="0">
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#775a19" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#775a19" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>

      <motion.div
        className="w-full h-full"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <Tree
          data={treeData}
          orientation="vertical"
          pathFunc="step"
          translate={translate}
          nodeSize={{ x: 220, y: 140 }}
          separation={{ siblings: 1.2, nonSiblings: 1.8 }}
          renderCustomNodeElement={renderCustomNode}
          pathClassFunc={() => 'custom-link'}
          transitionDuration={0}
          depthFactor={150}
          zoom={0.8}
          scaleExtent={{ min: 0.5, max: 2 }}
          collapsible={false}
          draggable
        />
      </motion.div>

      {isGenerating && (
        <motion.div
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
          initial={{ opacity: 0 }}
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <p className="text-sm font-sans text-on-surface-variant">
            正在构建学习路径...
          </p>
        </motion.div>
      )}

      <style>{`
        .custom-link {
          stroke: #c5c6cf;
          stroke-width: 2;
          fill: none;
          stroke-dasharray: 4 4;
          opacity: 0.4;
        }

        .rd3t-tree-container {
          width: 100%;
          height: 100%;
          user-select: none;
          -webkit-user-select: none;
          touch-action: none;
          overscroll-behavior: contain;
        }

        .rd3t-svg {
          user-select: none;
          -webkit-user-select: none;
          touch-action: none;
        }

        .graph-node {
          cursor: pointer;
        }

        .graph-node__shape {
          transition: stroke 0.18s ease;
        }

        .graph-node:hover .graph-node__shape {
          stroke: #182544;
        }
      `}</style>
    </div>
  )
}
