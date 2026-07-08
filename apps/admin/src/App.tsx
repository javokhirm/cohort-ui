import { useEffect, useState } from 'react';
import { RouterProvider } from '@tanstack/react-router';

import { Spinner } from '@repo/ui';
import { runRefresh } from '@/api/apiClient';
import { loadPermissions } from '@/api/me';
import { useSessionStore } from '@/store/sessionStore';
import { router } from './router';

// Resolve the session once at module load — survives React StrictMode's
// double-invoked effects (single in-flight refresh, no double network call).
// On a live session, follow the refresh with `/manage/me` so the resolved
// permission codes are in the store before route guards (`requirePermission`)
// run — otherwise the first guard would fail open.
const bootPromise = runRefresh().then((ok) => (ok ? loadPermissions() : undefined));

/**
 * Boot gate: hold the router until the silent refresh settles so route guards
 * see `authenticated` or `anonymous` — never the transient `unknown`.
 */
export function App() {
	const status = useSessionStore((s) => s.status);
	const [booted, setBooted] = useState(status !== 'unknown');

	useEffect(() => {
		void bootPromise.finally(() => setBooted(true));
	}, []);

	if (!booted || status === 'unknown') {
		return (
			<div className="flex min-h-svh items-center justify-center bg-background">
				<Spinner className="size-6" />
			</div>
		);
	}

	return <RouterProvider router={router} />;
}
