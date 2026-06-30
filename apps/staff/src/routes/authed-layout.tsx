import { useEffect } from 'react';
import { Outlet, useNavigate } from '@tanstack/react-router';

import { useSessionStore } from '@/store/sessionStore';
import { Header } from '@/layouts/Header';
import { Sidebar } from '@/layouts/Sidebar';

/**
 * Layout for the authenticated staff console. `beforeLoad` guards initial entry;
 * this effect handles the session being lost after entry (e.g. a 401 whose
 * silent refresh failed → the store flips to `anonymous`).
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
