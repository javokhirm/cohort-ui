import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';

import './styles/globals.css';
import './lib/env'; // validate env at boot — throws with a clear message if invalid
import { queryClient } from './api/queryClient';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<App />
		</QueryClientProvider>
	</StrictMode>,
);
