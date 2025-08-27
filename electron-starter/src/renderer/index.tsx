import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './globals.css'
import App from './src/app'

// Add platform class for CSS adjustments (e.g., macOS traffic lights)
const electronApi = (window as unknown as { electronApi?: { isMac?: boolean } }).electronApi
if (electronApi?.isMac) {
  document.documentElement.classList.add('platform-darwin')
} else {
  document.documentElement.classList.add('platform-other')
}

const container = document.getElementById('root')!
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
