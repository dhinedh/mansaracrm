import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// Auto-recover when a new deployment invalidates cached chunk hashes
window.addEventListener('vite:preloadError', (event) => {
  console.warn('Vite preload error: new deployment detected, reloading page...');
  window.location.reload();
});

window.addEventListener('error', (event) => {
  const msg = event?.message || '';
  if (
    msg.includes('Failed to fetch dynamically imported module') ||
    msg.includes('error loading dynamically imported module') ||
    msg.includes('Failed to load module script')
  ) {
    const key = 'vite_chunk_reload_attempt';
    const last = Number(sessionStorage.getItem(key) || 0);
    const now = Date.now();
    if (now - last > 15000) {
      sessionStorage.setItem(key, String(now));
      window.location.reload();
    }
  }
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

