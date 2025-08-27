import { jsx as _jsx } from "react/jsx-runtime";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './globals.css';
import App from './src/app';
// Add platform class for CSS adjustments (e.g., macOS traffic lights)
const electronApi = window.electronApi;
if (electronApi?.isMac) {
    document.documentElement.classList.add('platform-darwin');
}
else {
    document.documentElement.classList.add('platform-other');
}
const container = document.getElementById('root');
createRoot(container).render(_jsx(StrictMode, { children: _jsx(App, {}) }));
