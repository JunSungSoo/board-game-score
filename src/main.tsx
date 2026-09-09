import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import { QUERY_CLIENT } from './shared/api/query-client';
import './shared/styles/global.css';

createRoot(document.getElementById('root')!).render(<StrictMode><QueryClientProvider client={QUERY_CLIENT}><BrowserRouter><App /></BrowserRouter></QueryClientProvider></StrictMode>);
