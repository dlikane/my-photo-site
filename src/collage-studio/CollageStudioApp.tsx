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

  return (
    <ImagePoolProvider>
      <CollageStoreProvider>
        <DialogProvider>
          <div className="collage-studio-page app-shell">
            <Toolbar previewMode={previewMode} onTogglePreview={() => setPreviewMode((p) => !p)} />
            <div className="app-body">
              {!previewMode && <LibraryPanel />}
              <div className="app-center">
                <QuickStartTemplates />
                <CanvasEditor />
              </div>
              {!previewMode && <InspectorPanel />}
            </div>
          </div>
        </DialogProvider>
      </CollageStoreProvider>
    </ImagePoolProvider>
  )
}

export default CollageStudioApp
