/**
 * 知识图谱调试页面
 * 用于测试和诊断知识图谱渲染问题
 */

import { useState } from 'react'
import { KnowledgeGraph } from '../components/Planning/KnowledgeGraph'
import { AnimatedKnowledgeGraph } from '../components/Planning/AnimatedKnowledgeGraph'
import { buildIntelligentKnowledgeGraph } from '../utils/treeLayout'
import type { KnowledgeNode } from '../types/appFlow'
import type { PblLearningNode } from '../types/pbl'

// 测试数据 1: 简单的 3 节点图
const simpleNodes: KnowledgeNode[] = [
  {
    id: 'center',
    label: '中心节点',
    position: { x: 300, y: 250 },
    connections: ['left', 'right'],
    status: 'in_progress',
  },
  {
    id: 'left',
    label: '左节点',
    position: { x: 150, y: 250 },
    connections: ['center'],
    status: 'completed',
  },
  {
    id: 'right',
    label: '右节点',
    position: { x: 450, y: 250 },
    connections: ['center'],
    status: 'pending',
  },
]

// 测试数据 2: 复杂的多层图
const complexNodes: KnowledgeNode[] = [
  {
    id: 'center',
    label: '物理建模',
    position: { x: 300, y: 200 },
    connections: ['node-a', 'node-b', 'node-c'],
    status: 'in_progress',
  },
  {
    id: 'node-a',
    label: '力学基础',
    position: { x: 150, y: 120 },
    connections: ['center', 'node-d'],
    status: 'completed',
  },
  {
    id: 'node-b',
    label: '运动学',
    position: { x: 450, y: 120 },
    connections: ['center', 'node-e'],
    status: 'pending',
  },
  {
    id: 'node-c',
    label: '能量守恒',
    position: { x: 300, y: 320 },
    connections: ['center', 'node-f'],
    status: 'pending',
  },
  {
    id: 'node-d',
    label: '牛顿定律',
    position: { x: 100, y: 280 },
    connections: ['node-a'],
    status: 'completed',
  },
  {
    id: 'node-e',
    label: '速度加速度',
    position: { x: 500, y: 280 },
    connections: ['node-b'],
    status: 'pending',
  },
  {
    id: 'node-f',
    label: '动能势能',
    position: { x: 200, y: 400 },
    connections: ['node-c'],
    status: 'pending',
  },
]

// 测试数据 3: 真实的层级树结构（用于测试智能布局）
const hierarchicalNodes: PblLearningNode[] = [
  {
    id: 'root',
    goal_id: 'test',
    parent_id: null,
    title: '物理建模',
    description: '根节点',
    children: ['mechanics', 'kinematics', 'energy'],
    prerequisites: [],
    mastery_criteria: [],
    estimated_difficulty: 'medium',
    status: 'learning',
    component_hints: [],
    project_relevance: '',
  },
  {
    id: 'mechanics',
    goal_id: 'test',
    parent_id: 'root',
    title: '力学基础',
    description: '',
    children: ['newton', 'friction'],
    prerequisites: [],
    mastery_criteria: [],
    estimated_difficulty: 'medium',
    status: 'mastered',
    component_hints: [],
    project_relevance: '',
  },
  {
    id: 'newton',
    goal_id: 'test',
    parent_id: 'mechanics',
    title: '牛顿定律',
    description: '',
    children: [],
    prerequisites: [],
    mastery_criteria: [],
    estimated_difficulty: 'easy',
    status: 'mastered',
    component_hints: [],
    project_relevance: '',
  },
  {
    id: 'friction',
    goal_id: 'test',
    parent_id: 'mechanics',
    title: '摩擦力',
    description: '',
    children: [],
    prerequisites: [],
    mastery_criteria: [],
    estimated_difficulty: 'easy',
    status: 'mastered',
    component_hints: [],
    project_relevance: '',
  },
  {
    id: 'kinematics',
    goal_id: 'test',
    parent_id: 'root',
    title: '运动学',
    description: '',
    children: ['velocity', 'acceleration'],
    prerequisites: [],
    mastery_criteria: [],
    estimated_difficulty: 'medium',
    status: 'learning',
    component_hints: [],
    project_relevance: '',
  },
  {
    id: 'velocity',
    goal_id: 'test',
    parent_id: 'kinematics',
    title: '速度',
    description: '',
    children: [],
    prerequisites: [],
    mastery_criteria: [],
    estimated_difficulty: 'easy',
    status: 'unknown',
    component_hints: [],
    project_relevance: '',
  },
  {
    id: 'acceleration',
    goal_id: 'test',
    parent_id: 'kinematics',
    title: '加速度',
    description: '',
    children: [],
    prerequisites: [],
    mastery_criteria: [],
    estimated_difficulty: 'medium',
    status: 'unknown',
    component_hints: [],
    project_relevance: '',
  },
  {
    id: 'energy',
    goal_id: 'test',
    parent_id: 'root',
    title: '能量守恒',
    description: '',
    children: ['kinetic', 'potential'],
    prerequisites: [],
    mastery_criteria: [],
    estimated_difficulty: 'hard',
    status: 'unknown',
    component_hints: [],
    project_relevance: '',
  },
  {
    id: 'kinetic',
    goal_id: 'test',
    parent_id: 'energy',
    title: '动能',
    description: '',
    children: [],
    prerequisites: [],
    mastery_criteria: [],
    estimated_difficulty: 'medium',
    status: 'unknown',
    component_hints: [],
    project_relevance: '',
  },
  {
    id: 'potential',
    goal_id: 'test',
    parent_id: 'energy',
    title: '势能',
    description: '',
    children: [],
    prerequisites: [],
    mastery_criteria: [],
    estimated_difficulty: 'medium',
    status: 'unknown',
    component_hints: [],
    project_relevance: '',
  },
]

const intelligentLayoutNodes = buildIntelligentKnowledgeGraph(hierarchicalNodes)

export function KnowledgeGraphDebug() {
  const [showAnimated, setShowAnimated] = useState(true)
  const [key, setKey] = useState(0)

  const replayAnimation = () => {
    setKey((prev) => prev + 1)
  }

  return (
    <div className="min-h-screen bg-surface p-8">
      <div className="max-w-6xl mx-auto space-y-12">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-4xl font-bold text-primary mb-2">
              知识图谱调试页面
            </h1>
            <p className="text-on-surface-variant">
              测试知识图谱组件的渲染和交互
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowAnimated(!showAnimated)}
              className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              {showAnimated ? '显示静态版本' : '显示动画版本'}
            </button>
            {showAnimated && (
              <button
                onClick={replayAnimation}
                className="px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary/90 transition-colors"
              >
                重播动画
              </button>
            )}
          </div>
        </div>

        {/* 测试 1: 简单图 */}
        <section className="bg-white rounded-lg p-8 shadow-sm">
          <h2 className="font-display text-2xl font-bold text-primary mb-4">
            测试 1: 简单三节点图 {showAnimated && '(动画版)'}
          </h2>
          <div className="border border-outline-variant/20 rounded-lg p-4 bg-surface">
            {showAnimated ? (
              <AnimatedKnowledgeGraph key={`simple-${key}`} nodes={simpleNodes} />
            ) : (
              <KnowledgeGraph nodes={simpleNodes} />
            )}
          </div>
          <details className="mt-4">
            <summary className="text-sm text-on-surface-variant cursor-pointer">
              查看节点数据
            </summary>
            <pre className="mt-2 text-xs bg-surface-container-low p-4 rounded overflow-auto">
              {JSON.stringify(simpleNodes, null, 2)}
            </pre>
          </details>
        </section>

        {/* 测试 2: 复杂图 */}
        <section className="bg-white rounded-lg p-8 shadow-sm">
          <h2 className="font-display text-2xl font-bold text-primary mb-4">
            测试 2: 复杂多层图 {showAnimated && '(动画版)'}
          </h2>
          <div className="border border-outline-variant/20 rounded-lg p-4 bg-surface">
            {showAnimated ? (
              <AnimatedKnowledgeGraph key={`complex-${key}`} nodes={complexNodes} />
            ) : (
              <KnowledgeGraph nodes={complexNodes} />
            )}
          </div>
          <details className="mt-4">
            <summary className="text-sm text-on-surface-variant cursor-pointer">
              查看节点数据
            </summary>
            <pre className="mt-2 text-xs bg-surface-container-low p-4 rounded overflow-auto">
              {JSON.stringify(complexNodes, null, 2)}
            </pre>
          </details>
        </section>

        {/* 测试 3: 智能布局 */}
        <section className="bg-white rounded-lg p-8 shadow-sm">
          <h2 className="font-display text-2xl font-bold text-primary mb-4">
            测试 3: 智能树形布局 {showAnimated && '(动画版)'}
          </h2>
          <p className="text-sm text-on-surface-variant mb-4">
            使用 Reingold-Tilford 算法自动计算层级树的最优布局，避免节点重叠和连线交叉
          </p>
          <div className="border border-outline-variant/20 rounded-lg p-4 bg-surface">
            {showAnimated ? (
              <AnimatedKnowledgeGraph key={`intelligent-${key}`} nodes={intelligentLayoutNodes} />
            ) : (
              <KnowledgeGraph nodes={intelligentLayoutNodes} />
            )}
          </div>
          <details className="mt-4">
            <summary className="text-sm text-on-surface-variant cursor-pointer">
              查看节点数据（10个节点，3层结构）
            </summary>
            <pre className="mt-2 text-xs bg-surface-container-low p-4 rounded overflow-auto max-h-96">
              {JSON.stringify(intelligentLayoutNodes, null, 2)}
            </pre>
          </details>
        </section>

        {/* 测试 4: 空数据 */}
        <section className="bg-white rounded-lg p-8 shadow-sm">
          <h2 className="font-display text-2xl font-bold text-primary mb-4">
            测试 4: 空数据
          </h2>
          <div className="border border-outline-variant/20 rounded-lg p-4">
            <KnowledgeGraph nodes={[]} />
          </div>
          <p className="mt-4 text-sm text-on-surface-variant">
            应该显示空白或提示信息
          </p>
        </section>

        {/* SVG 基础测试 */}
        <section className="bg-white rounded-lg p-8 shadow-sm">
          <h2 className="font-display text-2xl font-bold text-primary mb-4">
            测试 5: SVG 基础渲染
          </h2>
          <div className="border border-outline-variant/20 rounded-lg p-4">
            <svg width="600" height="400" className="max-w-full">
              <circle cx="300" cy="200" r="50" fill="#182544" />
              <text
                x="300"
                y="200"
                textAnchor="middle"
                dominantBaseline="middle"
                fill="white"
                fontSize="16"
              >
                测试圆
              </text>
              <line
                x1="100"
                y1="100"
                x2="500"
                y2="300"
                stroke="#c5c6cf"
                strokeWidth="2"
              />
            </svg>
          </div>
          <p className="mt-4 text-sm text-on-surface-variant">
            如果能看到蓝色圆圈和灰色线条，说明 SVG 渲染正常
          </p>
        </section>
      </div>
    </div>
  )
}
