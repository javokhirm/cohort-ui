import { useEffect, useState } from 'react';
import { Outlet, useNavigate } from '@tanstack/react-router';

import { useSessionStore } from '@/store/sessionStore';
import { Header } from '@/layouts/Header';
import { Sidebar } from '@/layouts/Sidebar';
import { SubscriptionBanner } from '@/features/subscription';

/**
 * Layout for the authenticated staff console. `beforeLoad` guards initial entry;
 * this effect handles the session being lost after entry (e.g. a 401 whose
 * silent refresh failed → the store flips to `anonymous`).
 */
export function AuthedLayout() {
	const status = useSessionStore((s) => s.status);
	const navigate = useNavigate();
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

	useEffect(() => {
		if (status !== 'authenticated') {
			void navigate({ to: '/login' });
		}
	}, [status, navigate]);

	if (status !== 'authenticated') return null;

	return (
		<div className="flex h-svh overflow-hidden bg-background text-foreground">
			<Sidebar collapsed={sidebarCollapsed} />

			<div className="flex flex-1 flex-col overflow-hidden">
				<Header
					sidebarCollapsed={sidebarCollapsed}
					onSidebarToggle={() => setSidebarCollapsed((c) => !c)}
				/>
				<main className="bg-muted flex-1 overflow-y-auto px-6 py-8">
					<SubscriptionBanner />
					<Outlet />
				</main>
			</div>
		</div>
	);
}
