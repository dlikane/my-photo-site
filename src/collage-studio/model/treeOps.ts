// Immutable operations on the split tree: split / remove / resize / replace-image.
// These are the "templates" the user edits with -- there's no separate preset
// template system, just these primitives applied recursively.

import { makeFrame, newId, type FrameNode, type ImageRef, type Node, type SplitNode } from './collageTypes'

export function splitFrame(tree: Node, frameId: string, orientation: 'horizontal' | 'vertical'): Node {
  return mapNode(tree, (node) => {
    if (node.type === 'frame' && node.id === frameId) {
      const split: SplitNode = {
        type: 'split',
        id: newId(),
        orientation,
        ratio: 0.5,
        first: node,
        second: makeFrame(),
      }
      return split
    }
    return node
  })
}

/** Removes a frame by collapsing its parent split into the frame's sibling. No-op if frameId is the (only) root. */
export function removeFrame(tree: Node, frameId: string): Node {
  if (tree.type === 'frame' && tree.id === frameId) {
    return tree // can't remove the last remaining frame
  }

  function recurse(node: Node): Node {
    if (node.type === 'frame') return node
    if (node.first.type === 'frame' && node.first.id === frameId) return node.second
    if (node.second.type === 'frame' && node.second.id === frameId) return node.first
    return { ...node, first: recurse(node.first), second: recurse(node.second) }
  }
  return recurse(tree)
}

export function resizeSplit(tree: Node, splitId: string, ratio: number): Node {
  const clamped = Math.max(0.05, Math.min(0.95, ratio))
  return mapNode(tree, (node) => {
    if (node.type === 'split' && node.id === splitId) {
      return { ...node, ratio: clamped }
    }
    return node
  })
}

export function setFrameImage(tree: Node, frameId: string, image: ImageRef | null): Node {
  return mapNode(tree, (node) => {
    if (node.type === 'frame' && node.id === frameId) {
      return { ...node, image }
    }
    return node
  })
}

export function updateFrame(tree: Node, frameId: string, update: (frame: FrameNode) => FrameNode): Node {
  return mapNode(tree, (node) => {
    if (node.type === 'frame' && node.id === frameId) {
      return update(node)
    }
    return node
  })
}

function mapNode(node: Node, fn: (node: Node) => Node): Node {
  const mapped = fn(node)
  if (mapped !== node) return mapped
  if (node.type === 'frame') return node
  const first = mapNode(node.first, fn)
  const second = mapNode(node.second, fn)
  if (first === node.first && second === node.second) return node
  return { ...node, first, second }
}

export function countFrames(node: Node): number {
  if (node.type === 'frame') return 1
  return countFrames(node.first) + countFrames(node.second)
}
