import React from 'react';
import ReactDOM from 'react-dom/client';
import { TooltipProvider } from '@/src/components/ui/tooltip';
import App from './App.tsx';
import './style.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <TooltipProvider>
      <App />
    </TooltipProvider>
  </React.StrictMode>,
);
