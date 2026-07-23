import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';

import { initTheme } from '@repo/ui';
import { I18nProvider, initI18n } from '@repo/i18n';

import './styles/globals.css';
import './lib/env'; // validate env at boot — throws with a clear message if invalid
import { queryClient } from './api/queryClient';
import { App } from './App';

initTheme({ storageKey: 'cohort.teacher.theme' });
// Resolves localStorage → 'uz' now; the signed-in teacher's stored preference
// arrives on the login/refresh response and the session store applies it.
initI18n({ storageKey: 'cohort.teacher.locale' });

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<I18nProvider>
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>
		</I18nProvider>
	</StrictMode>,
);
