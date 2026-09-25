import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

// Puwedeng null kung walang <div id="root"> sa index.html — nahuli ng TypeScript
const root = document.getElementById('root');
if (!root) throw new Error('Missing <div id="root"> in index.html');

createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
