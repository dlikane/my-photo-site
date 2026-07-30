import { useState } from 'react'
import { CanvasEditor } from './components/CanvasEditor'
import { InspectorPanel } from './components/InspectorPanel'
import { LibraryPanel } from './components/LibraryPanel'
import { QuickStartTemplates } from './components/QuickStartTemplates'
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
        <DialogProvider>
          <div className="collage-studio-page app-shell">
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
                <QuickStartTemplates />
                <CanvasEditor previewMode={previewMode} />
              </div>
              <div className={`inspector-panel-wrap${mobileInspectorOpen ? ' open' : ''}`}>
                <InspectorPanel />
              </div>
            </div>
          </div>
        </DialogProvider>
      </CollageStoreProvider>
    </ImagePoolProvider>
  )
}

export default CollageStudioApp
