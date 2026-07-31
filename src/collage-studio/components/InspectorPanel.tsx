import { collectFrames } from '../model/geometry'
import { MAX_ZOOM, type Insert } from '../model/collageTypes'
import { updateFrame } from '../model/treeOps'
import { useCollageStore } from '../state/collageStore'

const ASPECT_PRESETS: { label: string; ratio: number }[] = [
  { label: '1:1', ratio: 1 },
  { label: '4:5', ratio: 5 / 4 },
]

function NumberField({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} />
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={Math.round(value * 1000) / 1000}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  )
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} />
    </label>
  )
}

export function InspectorPanel() {
  const { doc, editDoc, selectedFrameId, selectedInsertId } = useCollageStore()

  if (!doc) return <div className="inspector-panel">No collage open.</div>

  const frames = collectFrames(doc.tree)
  const selectedFrame = selectedFrameId ? frames[selectedFrameId] : null
  const selectedInsert = doc.inserts.find((i) => i.id === selectedInsertId) ?? null

  const updateInsert = (id: string, patch: Partial<Insert>) => {
    editDoc((d) => ({ ...d, inserts: d.inserts.map((i) => (i.id === id ? { ...i, ...patch } : i)) }))
  }

  return (
    <div className="inspector-panel">
      <section>
        <h3>Canvas</h3>
        <label className="field">
          <span>Name</span>
          <input type="text" value={doc.name} onChange={(e) => editDoc((d) => ({ ...d, name: e.target.value }))} />
        </label>
        <div className="field-row">
          <label className="field">
            <span>Width</span>
            <input
              type="number"
              value={doc.canvas.width}
              onChange={(e) => editDoc((d) => ({ ...d, canvas: { ...d.canvas, width: Number(e.target.value) } }))}
            />
          </label>
          <label className="field">
            <span>Height</span>
            <input
              type="number"
              value={doc.canvas.height}
              onChange={(e) => editDoc((d) => ({ ...d, canvas: { ...d.canvas, height: Number(e.target.value) } }))}
            />
          </label>
        </div>
        <div className="field-row">
          <span className="hint">Aspect:</span>
          {ASPECT_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => editDoc((d) => ({ ...d, canvas: { ...d.canvas, height: Math.round(d.canvas.width * preset.ratio) } }))}
            >
              {preset.label}
            </button>
          ))}
        </div>
        <NumberField
          label="JPEG quality"
          min={60}
          max={100}
          step={1}
          value={doc.jpegQuality}
          onChange={(v) => editDoc((d) => ({ ...d, jpegQuality: v }))}
        />
      </section>

      <section>
        <h3>Borders</h3>
        <h4>External</h4>
        <div className="field-row">
          <NumberField
            label="Width"
            min={0}
            max={80}
            step={1}
            value={doc.border.external.width}
            onChange={(v) => editDoc((d) => ({ ...d, border: { ...d.border, external: { ...d.border.external, width: v } } }))}
          />
          <ColorField
            label="Color"
            value={doc.border.external.color}
            onChange={(v) => editDoc((d) => ({ ...d, border: { ...d.border, external: { ...d.border.external, color: v } } }))}
          />
        </div>
        <h4>Grid (between frames)</h4>
        <div className="field-row">
          <NumberField
            label="Width"
            min={0}
            max={60}
            step={1}
            value={doc.border.grid.width}
            onChange={(v) => editDoc((d) => ({ ...d, border: { ...d.border, grid: { ...d.border.grid, width: v } } }))}
          />
          <ColorField
            label="Color"
            value={doc.border.grid.color}
            onChange={(v) => editDoc((d) => ({ ...d, border: { ...d.border, grid: { ...d.border.grid, color: v } } }))}
          />
        </div>
        <h4>Inserts (default border)</h4>
        <div className="field-row">
          <NumberField
            label="Width"
            min={0}
            max={40}
            step={1}
            value={doc.insertBorderDefault.width}
            onChange={(v) => editDoc((d) => ({ ...d, insertBorderDefault: { ...d.insertBorderDefault, width: v } }))}
          />
          <ColorField
            label="Color"
            value={doc.insertBorderDefault.color}
            onChange={(v) => editDoc((d) => ({ ...d, insertBorderDefault: { ...d.insertBorderDefault, color: v } }))}
          />
        </div>
        <button
          onClick={() =>
            editDoc((d) => ({ ...d, inserts: d.inserts.map((i) => ({ ...i, border: null })) }))
          }
        >
          Apply default border to all inserts
        </button>

        <h4>Inserts (default shadow)</h4>
        <div className="field-row">
          <NumberField
            label="Size (offset px)"
            min={0}
            max={60}
            step={1}
            value={doc.insertShadowDefault.offsetPx}
            onChange={(v) => editDoc((d) => ({ ...d, insertShadowDefault: { ...d.insertShadowDefault, offsetPx: v } }))}
          />
          <NumberField
            label="Direction (deg)"
            min={0}
            max={360}
            step={1}
            value={doc.insertShadowDefault.angleDeg}
            onChange={(v) => editDoc((d) => ({ ...d, insertShadowDefault: { ...d.insertShadowDefault, angleDeg: v } }))}
          />
        </div>
        <div className="field-row">
          <NumberField
            label="Blur (px)"
            min={0}
            max={60}
            step={1}
            value={doc.insertShadowDefault.blurPx}
            onChange={(v) => editDoc((d) => ({ ...d, insertShadowDefault: { ...d.insertShadowDefault, blurPx: v } }))}
          />
          <NumberField
            label="Opacity"
            min={0}
            max={1}
            step={0.05}
            value={doc.insertShadowDefault.opacity}
            onChange={(v) => editDoc((d) => ({ ...d, insertShadowDefault: { ...d.insertShadowDefault, opacity: v } }))}
          />
        </div>
        <ColorField
          label="Color"
          value={doc.insertShadowDefault.color}
          onChange={(v) => editDoc((d) => ({ ...d, insertShadowDefault: { ...d.insertShadowDefault, color: v } }))}
        />
        <button onClick={() => editDoc((d) => ({ ...d, inserts: d.inserts.map((i) => ({ ...i, shadow: null })) }))}>
          Apply default shadow to all inserts
        </button>
      </section>

      {selectedFrame && (
        <section>
          <h3>Selected frame</h3>
          {!selectedFrame.image ? (
            <p className="hint">Drag an image from the library onto this frame, or click a thumbnail.</p>
          ) : (
            <>
              <NumberField
                label="Zoom"
                min={1}
                max={MAX_ZOOM}
                step={0.05}
                value={selectedFrame.image.zoom}
                onChange={(v) =>
                  editDoc((d) => ({ ...d, tree: updateFrame(d.tree, selectedFrame.id, (f) => ({ ...f, image: f.image ? { ...f.image, zoom: v } : f.image })) }))
                }
              />
              <div className="field-row">
                <NumberField
                  label="Focal X"
                  min={0}
                  max={1}
                  step={0.01}
                  value={selectedFrame.image.focal.x}
                  onChange={(v) =>
                    editDoc((d) => ({
                      ...d,
                      tree: updateFrame(d.tree, selectedFrame.id, (f) => (f.image ? { ...f, image: { ...f.image, focal: { ...f.image.focal, x: v } } } : f)),
                    }))
                  }
                />
                <NumberField
                  label="Focal Y"
                  min={0}
                  max={1}
                  step={0.01}
                  value={selectedFrame.image.focal.y}
                  onChange={(v) =>
                    editDoc((d) => ({
                      ...d,
                      tree: updateFrame(d.tree, selectedFrame.id, (f) => (f.image ? { ...f, image: { ...f.image, focal: { ...f.image.focal, y: v } } } : f)),
                    }))
                  }
                />
              </div>
              <button
                onClick={() =>
                  editDoc((d) => ({ ...d, tree: updateFrame(d.tree, selectedFrame.id, (f) => ({ ...f, image: null })) }))
                }
              >
                Clear image
              </button>
            </>
          )}
        </section>
      )}

      {selectedInsert && (
        <section>
          <h3>Selected insert</h3>
          {/* Simplified down from a full panel (still matching the new
              design's intent), but not to *just* corner radius anymore --
              size/zoom/focal are now direct-manipulation on the canvas
              itself (resize/move handles, wheel-to-zoom, drag-to-pan; see
              CanvasEditor.tsx), so they don't need fields here. Feather has
              no canvas gesture equivalent, so it's kept as a field. Border/
              shadow override are still in the data model but not exposed
              here -- they follow the doc-level defaults (see the "Inserts
              (default border/shadow)" sections above). */}
          <p className="hint">Drag the insert to pan its image, scroll to zoom, or use the move/resize handles.</p>
          <label className="field">
            <span>Corner radius (0 = square, 50 = circle)</span>
            <input
              type="range"
              min={0}
              max={50}
              value={Math.round(selectedInsert.cornerRadiusPct * 100)}
              onChange={(e) => updateInsert(selectedInsert.id, { cornerRadiusPct: Number(e.target.value) / 100 })}
            />
            <input
              type="number"
              min={0}
              max={50}
              value={Math.round(selectedInsert.cornerRadiusPct * 100)}
              onChange={(e) => updateInsert(selectedInsert.id, { cornerRadiusPct: Number(e.target.value) / 100 })}
            />
          </label>
          <NumberField
            label="Feather (px)"
            min={0}
            max={60}
            step={1}
            value={selectedInsert.featherPx}
            onChange={(v) => updateInsert(selectedInsert.id, { featherPx: v })}
          />
        </section>
      )}
    </div>
  )
}
