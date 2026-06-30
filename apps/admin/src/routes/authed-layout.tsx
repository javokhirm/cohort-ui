import { useEffect } from 'react';
import { Outlet, useNavigate } from '@tanstack/react-router';

import { useSessionStore } from '@/lib/auth/session-store';
import { Sidebar } from '@/layouts/Sidebar';
import { Header } from '@/layouts/Header';

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
		<div className="flex h-svh flex-col overflow-hidden bg-background text-foreground">
			<Header />

			<div className="flex flex-1 overflow-hidden">
				<Sidebar />
				<main className="flex-1 overflow-y-auto px-6 py-8">
					<Outlet />
				</main>
			</div>
		</div>
	);
}
