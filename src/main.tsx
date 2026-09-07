import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import { executeAutoPurgeAndCleanCache, initAutoUpdateBackgroundListener } from './utils/autoPurge';
import './index.css';

// 🚀 Ejecutar rutina de Auto-Purga y Sincronización de Versión Inmediata
executeAutoPurgeAndCleanCache();
initAutoUpdateBackgroundListener();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
);

