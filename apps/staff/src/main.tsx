import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { Toaster } from '@repo/ui';
import './index.css';
import App from './App.tsx';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<App />
		<Toaster />
	</StrictMode>,
);
