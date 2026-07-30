import { makeFrame, newId, type Node, type SplitNode } from '../model/collageTypes'
import { countFrames } from '../model/treeOps'
import { useCollageStore } from '../state/collageStore'

function split(orientation: 'horizontal' | 'vertical', first: Node, second: Node, ratio = 0.5): SplitNode {
  return { type: 'split', id: newId(), orientation, ratio, first, second }
}

/** N equal frames along one axis, via progressively-smaller ratios (1/n, 1/(n-1), ...). */
function evenSplit(orientation: 'horizontal' | 'vertical', count: number): Node {
  function build(remaining: number): Node {
    if (remaining === 1) return makeFrame()
    return split(orientation, makeFrame(), build(remaining - 1), 1 / remaining)
  }
  return build(count)
}

/** `cols` columns, each independently split into `rows` even rows. */
function evenGrid(cols: number, rows: number): Node {
  function buildCols(remaining: number): Node {
    if (remaining === 1) return evenSplit('vertical', rows)
    return split('horizontal', evenSplit('vertical', rows), buildCols(remaining - 1), 1 / remaining)
  }
  return buildCols(cols)
}

const TEMPLATES: { label: string; build: () => Node }[] = [
  { label: '2 columns', build: () => split('horizontal', makeFrame(), makeFrame()) },
  { label: '2 rows', build: () => split('vertical', makeFrame(), makeFrame()) },
  {
    label: '3 columns',
    build: () => split('horizontal', makeFrame(), split('horizontal', makeFrame(), makeFrame(), 0.5), 0.333),
  },
  {
    label: '2x2 grid',
    build: () =>
      split('vertical', split('horizontal', makeFrame(), makeFrame()), split('horizontal', makeFrame(), makeFrame())),
  },
  { label: '3x3 grid', build: () => evenGrid(3, 3) },
  { label: '4x4 grid', build: () => evenGrid(4, 4) },
]

/** Starting-point layouts, built from the same split primitive as manual editing --
 * not a separate template system. Only offered while the canvas is still a single
 * blank frame, so it can't clobber in-progress work. */
export function QuickStartTemplates() {
  const { doc, editDoc } = useCollageStore()
  if (!doc || countFrames(doc.tree) > 1) return null

  return (
    <div className="quick-start">
      <span>Start from:</span>
      {TEMPLATES.map((t) => (
        <button key={t.label} onClick={() => editDoc((d) => ({ ...d, tree: t.build() }))}>
          {t.label}
        </button>
      ))}
    </div>
  )
}
