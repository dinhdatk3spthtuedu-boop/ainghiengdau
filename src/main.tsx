import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { registerSW } from 'virtual:pwa-register';

// Suppress specific MediaPipe/TensorFlow Lite informational logs
const originalLog = console.log;
const originalInfo = console.info;
const originalWarn = console.warn;

const suppressFilter = (args: any[], originalFn: Function) => {
  const isSuppressed = args.some(arg => 
    typeof arg === 'string' && (
      arg.includes('XNNPACK') || 
      arg.includes('delegate') || 
      arg.includes('Created TensorFlow Lite') ||
      arg.includes('Mediapipe')
    )
  );
  if (isSuppressed) return;
  originalFn.apply(console, args);
};

console.log = (...args) => suppressFilter(args, originalLog);
console.info = (...args) => suppressFilter(args, originalInfo);
console.warn = (...args) => suppressFilter(args, originalWarn);

registerSW();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
