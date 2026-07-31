import { useState } from 'react'
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
            <div className="app-body">
              <div className={`library-panel-wrap${mobileLibraryOpen ? ' open' : ''}`}>
                <LibraryPanel />
              </div>
              <div className="app-center">
                <CanvasEditor previewMode={previewMode} />
              </div>
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
