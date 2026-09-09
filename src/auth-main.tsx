import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client';
import { AuthPage } from './features/auth/AuthPage';
import '../style.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode><QueryClientProvider client={queryClient}>
    <AuthPage signup={document.body.dataset.authPage === 'signup'} />
  </QueryClientProvider></StrictMode>,
);
