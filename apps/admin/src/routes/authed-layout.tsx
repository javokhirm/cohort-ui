import { useEffect } from 'react';
import { Outlet, useNavigate } from '@tanstack/react-router';

import { useSessionStore } from '@/lib/auth/session-store';
import { ConsoleShell } from '@/components/console-shell';

/**
 * Layout for the authenticated console. `beforeLoad` guards the initial entry;
 * this effect handles the session being lost *after* entry (e.g. a 401 whose
 * silent refresh failed → the store flips to `anonymous`) by redirecting to login.
 */
export function AuthedLayout() {
	const status = useSessionStore((s) => s.status);
	const navigate = useNavigate();

	useEffect(() => {
		if (status !== 'authenticated') {
			void navigate({ to: '/login' });
		}
	}, [status, navigate]);

	if (status !== 'authenticated') return null;

	return (
		<ConsoleShell>
			<Outlet />
		</ConsoleShell>
	);
}
