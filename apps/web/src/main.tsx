import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { initCornerstone } from './modules/viewer/cornerstoneInit'
import { installDevNetworkGuard } from './modules/privacy/guard'

installDevNetworkGuard()

initCornerstone()
  .then(() => {
    const root = document.getElementById('root')
    if (!root) throw new Error('Root element #root not found in index.html')
    createRoot(root).render(
      <StrictMode>
        <App />
      </StrictMode>
    )
  })
  .catch((err: unknown) => {
    console.error('Failed to initialize Cornerstone3D:', err)
    const root = document.getElementById('root')
    if (root) {
      root.innerHTML = '<p style="color:#f87171;padding:2rem;font-family:system-ui">Failed to initialize DICOM viewer. Please use Chrome, Edge, or Firefox.</p>'
    }
  })
