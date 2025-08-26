import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './globals.css'
import App from './src/app'

const container = document.getElementById('root')!
createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
