import { useEffect, useState } from 'react';
import { Outlet, useNavigate, useRouterState } from '@tanstack/react-router';

import { useSessionStore } from '@/store/sessionStore';
import { Header } from '@/layouts/Header';
import { MobileNavSheet } from '@/layouts/MobileNavSheet';
import { Sidebar } from '@/layouts/Sidebar';

/**
 * Layout for the authenticated staff console. `beforeLoad` guards initial entry;
 * this effect handles the session being lost after entry (e.g. a 401 whose
 * silent refresh failed → the store flips to `anonymous`).
 *
 * Two nav chromes, chosen by CSS rather than by a media-query hook so there's no
 * hydration flicker and no state to keep in step with the viewport: the rail is
 * `hidden md:flex`, and below `md` the same nav is the `MobileNavSheet` overlay.
 * The rail used to render in-flow at every width, which left a phone ~150px of
 * content and scrolled the page sideways.
 */
export function AuthedLayout() {
	const status = useSessionStore((s) => s.status);
	const navigate = useNavigate();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

	// The drawer's open state is the route it was opened on, so *any* navigation
	// closes it — a browser back gesture as much as tapping a nav row. Derived
	// rather than synchronised in an effect, so there's no cascading render and
	// no window where the drawer covers a page it no longer belongs to.
	const [openedOnPath, setOpenedOnPath] = useState<string | null>(null);
	const mobileNavOpen = openedOnPath === pathname;

	useEffect(() => {
		if (status !== 'authenticated') {
			void navigate({ to: '/login' });
		}
	}, [status, navigate]);

	if (status !== 'authenticated') return null;

	return (
		// `pl-safe-l pr-safe-r`: `viewport-fit=cover` (index.html) is what lets the
		// drawer footer clear the home indicator, but it also stops the browser
		// insetting content from a landscape notch — so the shell does it here.
		<div className="flex h-svh overflow-hidden bg-background pl-safe-l pr-safe-r text-foreground">
			<Sidebar collapsed={sidebarCollapsed} />

			<MobileNavSheet
				open={mobileNavOpen}
				onOpenChange={(next) => setOpenedOnPath(next ? pathname : null)}
			/>

			<div className="flex min-w-0 flex-1 flex-col overflow-hidden">
				<Header
					sidebarCollapsed={sidebarCollapsed}
					onSidebarToggle={() => setSidebarCollapsed((c) => !c)}
					onMenuOpen={() => setOpenedOnPath(pathname)}
				/>
				<main className="flex-1 overflow-y-auto overscroll-contain bg-muted px-4 py-5 md:px-6 md:py-8">
					{/* The inset goes on a wrapper, not on `main`: `pb-safe-b` would
					    replace the `py-*` bottom padding rather than add to it, and
					    resolves to 0 on hardware with no home indicator. */}
					<div className="pb-safe-b">
						<Outlet />
					</div>
				</main>
			</div>
		</div>
	);
}
