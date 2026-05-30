/**
 * 智能树形布局算法
 * 基于 Reingold-Tilford 算法，自动计算层级树的最优布局
 */

import type { PblLearningNode } from '../types/pbl'
import type { KnowledgeNode } from '../types/appFlow'

interface TreeNode {
  id: string
  title: string
  children: TreeNode[]
  parent: TreeNode | null
  x: number
  y: number
  mod: number // 修正值，用于布局调整
  status: PblLearningNode['status']
}

/**
 * 将扁平的节点列表转换为树形结构
 */
function buildTree(nodes: PblLearningNode[]): TreeNode[] {
  const nodeMap = new Map<string, TreeNode>()
  const roots: TreeNode[] = []

  // 第一遍：创建所有节点
  nodes.forEach((node) => {
    nodeMap.set(node.id, {
      id: node.id,
      title: node.title,
      children: [],
      parent: null,
      x: 0,
      y: 0,
      mod: 0,
      status: node.status,
    })
  })

  // 第二遍：建立父子关系
  nodes.forEach((node) => {
    const treeNode = nodeMap.get(node.id)!

    if (node.parent_id) {
      const parent = nodeMap.get(node.parent_id)
      if (parent) {
        treeNode.parent = parent
        parent.children.push(treeNode)
      }
    } else {
      roots.push(treeNode)
    }
  })

  return roots
}

/**
 * 计算节点的初始 x 坐标（后序遍历）
 */
function calculateInitialX(node: TreeNode, depth: number = 0): void {
  node.y = depth

  if (node.children.length === 0) {
    // 叶子节点：如果有左兄弟，则在其右侧；否则 x = 0
    if (node.parent) {
      const siblings = node.parent.children
      const index = siblings.indexOf(node)
      if (index > 0) {
        node.x = siblings[index - 1].x + 1
      } else {
        node.x = 0
      }
    } else {
      node.x = 0
    }
  } else {
    // 非叶子节点：递归处理子节点
    node.children.forEach((child) => {
      calculateInitialX(child, depth + 1)
    })

    // 将当前节点放在子节点的中间
    const leftmost = node.children[0]
    const rightmost = node.children[node.children.length - 1]
    const mid = (leftmost.x + rightmost.x) / 2

    if (node.parent) {
      const siblings = node.parent.children
      const index = siblings.indexOf(node)
      if (index > 0) {
        node.x = siblings[index - 1].x + 1
        node.mod = node.x - mid
      } else {
        node.x = mid
      }
    } else {
      node.x = mid
    }
  }
}

/**
 * 检查并修正子树之间的冲突
 */
function checkConflicts(node: TreeNode, minSeparation: number = 1): void {
  function getLeftContour(n: TreeNode, modSum: number, contour: Map<number, number>): void {
    if (!contour.has(n.y) || n.x + modSum < contour.get(n.y)!) {
      contour.set(n.y, n.x + modSum)
    }
    n.children.forEach((child) => {
      getLeftContour(child, modSum + n.mod, contour)
    })
  }

  function getRightContour(n: TreeNode, modSum: number, contour: Map<number, number>): void {
    if (!contour.has(n.y) || n.x + modSum > contour.get(n.y)!) {
      contour.set(n.y, n.x + modSum)
    }
    n.children.forEach((child) => {
      getRightContour(child, modSum + n.mod, contour)
    })
  }

  for (let i = 0; i < node.children.length - 1; i++) {
    const leftTree = node.children[i]
    const rightTree = node.children[i + 1]

    const leftContour = new Map<number, number>()
    const rightContour = new Map<number, number>()

    getRightContour(leftTree, 0, leftContour)
    getLeftContour(rightTree, 0, rightContour)

    let shift = 0
    for (let level = leftTree.y + 1; level <= Math.max(...leftContour.keys(), ...rightContour.keys()); level++) {
      const leftPos = leftContour.get(level) ?? -Infinity
      const rightPos = rightContour.get(level) ?? Infinity
      const distance = leftPos - rightPos
      if (distance + minSeparation > shift) {
        shift = distance + minSeparation
      }
    }

    if (shift > 0) {
      rightTree.x += shift
      rightTree.mod += shift
    }
  }
}

/**
 * 计算最终坐标（前序遍历，累加 mod 值）
 */
function calculateFinalPositions(node: TreeNode, modSum: number = 0): void {
  node.x += modSum
  node.children.forEach((child) => {
    calculateFinalPositions(child, modSum + node.mod)
  })
}

/**
 * 将树节点转换为画布坐标
 */
function treeToCanvasCoordinates(
  roots: TreeNode[],
  nodeWidth: number = 120,
  nodeHeight: number = 100,
  padding: number = 50
): KnowledgeNode[] {
  const result: KnowledgeNode[] = []

  // 找到 x 坐标的范围
  let minX = Infinity
  let maxX = -Infinity

  function traverse(node: TreeNode): void {
    minX = Math.min(minX, node.x)
    maxX = Math.max(maxX, node.x)
    node.children.forEach(traverse)
  }

  roots.forEach(traverse)

  // 转换坐标
  function convert(node: TreeNode): void {
    const canvasX = padding + (node.x - minX) * nodeWidth + nodeWidth / 2
    const canvasY = padding + node.y * nodeHeight + nodeHeight / 2

    result.push({
      id: node.id,
      label: node.title,
      position: { x: canvasX, y: canvasY },
      connections: node.children.map((child) => child.id),
      status: mapStatus(node.status),
    })

    node.children.forEach(convert)
  }

  roots.forEach(convert)
  return result
}

function mapStatus(status: PblLearningNode['status']): 'completed' | 'in_progress' | 'pending' {
  if (status === 'mastered' || status === 'skipped') return 'completed'
  if (status === 'learning' || status === 'review') return 'in_progress'
  return 'pending'
}

/**
 * 主函数：智能布局
 */
export function buildIntelligentKnowledgeGraph(nodes: PblLearningNode[]): KnowledgeNode[] {
  if (nodes.length === 0) return []

  // 1. 构建树形结构
  const roots = buildTree(nodes)

  // 2. 计算初始布局
  roots.forEach((root) => {
    calculateInitialX(root)
    checkConflicts(root)
    calculateFinalPositions(root)
  })

  // 3. 转换为画布坐标
  return treeToCanvasCoordinates(roots)
}
