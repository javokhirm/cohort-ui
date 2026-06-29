import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';

import './styles/globals.css';
import './lib/env'; // validate env at boot — throws with a clear message if invalid
import { App } from './app/app';
import { queryClient } from './lib/query-client';

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<QueryClientProvider client={queryClient}>
			<App />
		</QueryClientProvider>
	</StrictMode>,
);
