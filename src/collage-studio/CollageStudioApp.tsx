import { CanvasEditor } from './components/CanvasEditor'
import { InspectorPanel } from './components/InspectorPanel'
import { LibraryPanel } from './components/LibraryPanel'
import { QuickStartTemplates } from './components/QuickStartTemplates'
import { Toolbar } from './components/Toolbar'
import { CollageStoreProvider } from './state/collageStore'
import './collage-studio.css'

function CollageStudioApp() {
  return (
    <CollageStoreProvider>
      <div className="collage-studio-page app-shell">
        <Toolbar />
        <div className="app-body">
          <LibraryPanel />
          <div className="app-center">
            <QuickStartTemplates />
            <CanvasEditor />
          </div>
          <InspectorPanel />
        </div>
      </div>
    </CollageStoreProvider>
  )
}

export default CollageStudioApp
