import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Register service worker for offline use
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/bonus-bridge-pwa/service-worker.js')
      .then(reg => console.log('SW registered:', reg.scope))
      .catch(err => console.log('SW registration failed:', err));
  });
}