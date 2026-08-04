import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './view/App';
import { poke } from './runtime/game';
import './view/styles.css';

// Space stokes from anywhere. Registered at module scope so StrictMode's
// double-invoked effects cannot bind it twice.
addEventListener('keydown', e => {
  if (e.code === 'Space') { e.preventDefault(); poke(); }
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
