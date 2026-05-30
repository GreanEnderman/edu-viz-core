/**
 * 规划状态主容器
 * 展示知识图谱生成动画，完成后显示进入学习按钮
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import type { PlanningState } from '../../types/appFlow'
import { D3KnowledgeGraph } from './D3KnowledgeGraph'

interface PlanningScreenProps {
  data: PlanningState | null
  onComplete?: () => void
}

export function PlanningScreen({ data, onComplete }: PlanningScreenProps) {
  const [animationComplete, setAnimationComplete] = useState(false)

  // 计算动画完成时间（节点数 * 延迟 + 额外缓冲）
  useEffect(() => {
    if (!data) return

    const nodeCount = data.knowledgeGraph.length
    const animationDuration = nodeCount * 150 + 1000 // 每个节点 150ms + 1s 缓冲

    const timer = setTimeout(() => {
      setAnimationComplete(true)
    }, animationDuration)

    return () => clearTimeout(timer)
  }, [data])

  if (!data) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <motion.div
            className="w-16 h-16 mx-auto mb-4 border-4 border-secondary border-t-transparent rounded-full"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className="text-on-surface-variant font-sans">正在构建学习路径...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-12 py-16 overflow-y-auto no-scrollbar">
      {/* 标题区域 */}
      <motion.div
        className="text-center mb-12"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <p className="text-sm font-sans text-on-surface-variant mb-2 uppercase tracking-wider">
          LEARNING PATH
        </p>
        <h2 className="font-display text-[42px] text-primary leading-tight font-bold mb-4">
          {data.projectTitle}
        </h2>
        <p className="font-sans text-lg text-on-surface-variant max-w-2xl mx-auto">
          {animationComplete
            ? '学习路径已构建完成，准备开始你的学习之旅'
            : '正在为你构建专属学习路径...'}
        </p>
      </motion.div>

      {/* 知识图谱 - 生成动画 */}
      <div className="w-full max-w-4xl mb-12">
        <D3KnowledgeGraph
          nodes={data.knowledgeGraph}
          isGenerating={!animationComplete}
        />
      </div>

      {/* 底部操作区 */}
      <motion.div
        className="-mt-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: animationComplete ? 1 : 0 }}
        transition={{ duration: 0.5 }}
      >
        {animationComplete && (
          <motion.button
            onClick={onComplete}
            className="group relative px-8 py-4 bg-gradient-to-r from-primary to-[#2a3a5f] text-white font-sans font-medium text-lg rounded-full shadow-lg hover:shadow-xl transition-all duration-300"
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <span className="relative z-10 flex items-center gap-2">
              开始学习
              <svg
                className="w-5 h-5 group-hover:translate-x-1 transition-transform"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </span>
            {/* 金色光晕效果 */}
            <motion.div
              className="absolute inset-0 rounded-full bg-secondary opacity-0 group-hover:opacity-20 blur-xl"
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
              }}
            />
          </motion.button>
        )}

        {!animationComplete && (
          <p className="text-sm font-sans text-on-surface-variant italic mt-4">
            请稍候，正在分析知识结构...
          </p>
        )}
      </motion.div>
    </div>
  )
}
