import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HeadlessMantineProvider } from '@mantine/core';
import { App } from './App';
import './styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HeadlessMantineProvider>
      <App />
    </HeadlessMantineProvider>
  </StrictMode>,
);
