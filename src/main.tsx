// src/main.tsx
import React from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// In dev, ensure no stale Service Worker controls the page
if (import.meta.env.DEV && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    regs.forEach((r) => r.unregister());
  }).catch(() => {});
}

// Register Service Worker only in production builds
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((registration) => {
        console.log('SW зарегистрирован: ', registration);
        try {
          if ((window as any).OneSignalDeferred) {
            (window as any).OneSignalDeferred.push(async function(OneSignal: any) {
              try { await OneSignal.Notifications.requestPermission({ fallbackToSettings: true }); } catch {}
            });
          }
        } catch {}
      })
      .catch((registrationError) => {
        console.log('SW ошибка регистрации: ', registrationError);
      });
  });
}
