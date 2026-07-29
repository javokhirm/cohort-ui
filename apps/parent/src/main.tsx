import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';

import { initTheme } from '@repo/ui';
import { I18nProvider, initI18n } from '@repo/i18n';

import './styles/globals.css';
import './lib/env'; // validate env at boot — throws with a clear message if invalid
import { queryClient } from './api/queryClient';
import { initAppLocales } from './locales';
import { App } from './App';

// Key must match the pre-paint bootstrap script in index.html.
initTheme({ storageKey: 'cohort.parent.theme' });
// Resolves localStorage → 'uz' now; once login lands, the signed-in user's
// stored preference arrives on the login/refresh response.
initI18n({ storageKey: 'cohort.parent.locale' });
// Feature-screen catalogs — must follow initI18n, which creates the resource store.
initAppLocales();

createRoot(document.getElementById('root')!).render(
	<StrictMode>
		<I18nProvider>
			<QueryClientProvider client={queryClient}>
				<App />
			</QueryClientProvider>
		</I18nProvider>
	</StrictMode>,
);
