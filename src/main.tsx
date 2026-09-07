import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { syncWithCloud } from './utils/cloudSync.ts';
import './index.css';

// Disparo inmediato a la Bóveda Cloud antes de montar la aplicación
syncWithCloud(true).catch(() => {});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
