import '@fontsource-variable/inter';
import '@fontsource-variable/playfair-display';
// Baybayin glyphs only (unicode-range), ~6 KB, used by the page backdrops.
import '@fontsource/noto-sans-tagalog/tagalog-400.css';
import './index.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App';

registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
