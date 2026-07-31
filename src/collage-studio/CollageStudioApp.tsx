import { useCallback, useRef, useState } from 'react'
import { CanvasEditor } from './components/CanvasEditor'
import { InspectorPanel } from './components/InspectorPanel'
import { LibraryPanel } from './components/LibraryPanel'
import { Toolbar } from './components/Toolbar'
import { CollageStoreProvider } from './state/collageStore'
import { DialogProvider } from './state/dialogStore'
import { ImagePoolProvider } from './state/imagePoolStore'
import './collage-studio.css'

function CollageStudioApp() {
  const [previewMode, setPreviewMode] = useState(false)
  // Mobile only (see collage-studio.css @media) -- on wide screens the panels
  // are always-visible flex columns and these flags have no visual effect.
  const [mobileLibraryOpen, setMobileLibraryOpen] = useState(false)
  const [mobileInspectorOpen, setMobileInspectorOpen] = useState(false)

  const [libraryWidth, setLibraryWidth] = useState(280)
  const [inspectorWidth, setInspectorWidth] = useState(300)
  const resizeStartRef = useRef<{ startX: number; startWidth: number } | null>(null)

  const startResizeLibrary = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    resizeStartRef.current = { startX: e.clientX, startWidth: libraryWidth }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [libraryWidth])

  const onResizeLibraryMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const start = resizeStartRef.current
    if (!start) return
    setLibraryWidth(Math.max(200, Math.min(520, start.startWidth + (e.clientX - start.startX))))
  }, [])

  const startResizeInspector = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    resizeStartRef.current = { startX: e.clientX, startWidth: inspectorWidth }
    e.currentTarget.setPointerCapture(e.pointerId)
  }, [inspectorWidth])

  const onResizeInspectorMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const start = resizeStartRef.current
    if (!start) return
    setInspectorWidth(Math.max(220, Math.min(520, start.startWidth - (e.clientX - start.startX))))
  }, [])

  const endResize = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    resizeStartRef.current = null
    e.currentTarget.releasePointerCapture(e.pointerId)
  }, [])

  return (
    <ImagePoolProvider>
      <CollageStoreProvider>
        {/* DialogProvider must be *inside* .collage-studio-page, not wrapping
            it -- it renders its popup as a sibling of {children}, and every
            rule in collage-studio.css (including .dialog-overlay's
            position:fixed styling) is scoped under .collage-studio-page. If
            the popup isn't a descendant of that class, it gets no styling at
            all and renders as a plain block element wherever it lands in
            normal document flow -- which is exactly what "the confirm text
            shows at the bottom of the page, unstyled" was. */}
        <div className="collage-studio-page app-shell">
          <DialogProvider>
            <Toolbar
              previewMode={previewMode}
              onTogglePreview={() => setPreviewMode((p) => !p)}
              onToggleLibrary={() => setMobileLibraryOpen((o) => !o)}
              onToggleInspector={() => setMobileInspectorOpen((o) => !o)}
            />
            <div
              className="app-body"
              style={{ '--library-width': `${libraryWidth}px`, '--inspector-width': `${inspectorWidth}px` } as React.CSSProperties}
            >
              <div className={`library-panel-wrap${mobileLibraryOpen ? ' open' : ''}`}>
                <LibraryPanel />
              </div>
              <div
                className="resize-handle"
                onPointerDown={startResizeLibrary}
                onPointerMove={onResizeLibraryMove}
                onPointerUp={endResize}
              />
              <div className="app-center">
                <CanvasEditor previewMode={previewMode} />
              </div>
              <div
                className="resize-handle"
                onPointerDown={startResizeInspector}
                onPointerMove={onResizeInspectorMove}
                onPointerUp={endResize}
              />
              <div className={`inspector-panel-wrap${mobileInspectorOpen ? ' open' : ''}`}>
                <InspectorPanel />
              </div>
            </div>
          </DialogProvider>
        </div>
      </CollageStoreProvider>
    </ImagePoolProvider>
  )
}

export default CollageStudioApp
