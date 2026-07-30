import { useEffect, useState } from 'react';
import { RouterProvider } from '@tanstack/react-router';

import { Spinner } from '@repo/ui';

import { runRefresh } from '@/api/apiClient';
import { useSessionStore } from '@/store/sessionStore';
import { router } from './router';

// Resolve the session once, at module load — survives React StrictMode's double-invoked
// effects (a single in-flight refresh, no double network call). There is no follow-up
// profile fetch: the student surface has no `/me` boot fetch, so the refresh response's
// `user` is the whole session (mirrors `apps/teacher`).
const bootPromise = runRefresh();

/**
 * Boot gate: hold the router until the silent refresh settles, so route guards see
 * `authenticated`/`anonymous` instead of the transient `unknown`.
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
