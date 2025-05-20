// Updated index.js - Enable PWA functionality
import React from 'react';
import ReactDOM from 'react-dom/client';
import './global.css';
import App from './App';
import * as serviceWorkerRegistration from './serviceWorker';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

// Enable service worker for PWA functionality
// This allows the app to work offline and load faster
serviceWorkerRegistration.register({
  onSuccess: () => {
    console.log('Bridge app is now available offline!');
  },
  onUpdate: () => {
    console.log('New version available! Please refresh to update.');
    // Optionally show a notification to user about update
  }
});