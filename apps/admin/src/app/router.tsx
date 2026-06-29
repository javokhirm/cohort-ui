import {
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	redirect,
} from '@tanstack/react-router';

import { Toaster } from '@repo/ui';
import { requireAuth, requireRole } from '../lib/auth/guards';
import { useSessionStore } from '../lib/auth/session-store';
import { LoginRoute } from '../routes/login';
import { AuthedLayout } from '../routes/authed-layout';
import { DashboardPage } from '../routes/dashboard';
import { TenantsPage } from '../routes/tenants/index';
import { TenantDetailPage } from '../routes/tenants/$tenantId/index';
import { ForbiddenPage } from '../routes/forbidden';

const rootRoute = createRootRoute({
	component: () => (
		<>
			<Outlet />
			<Toaster position="top-right" />
		</>
	),
});

const loginRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/login',
	validateSearch: (search: Record<string, unknown>): { next?: string } => {
		const next = typeof search.next === 'string' ? search.next : undefined;
		// Same-origin path only — defends against open redirects via `next`.
		const safe =
			next && next.startsWith('/') && !next.startsWith('//') ? next : undefined;
		return { next: safe };
	},
	beforeLoad: () => {
		if (useSessionStore.getState().status === 'authenticated') {
			throw redirect({ to: '/' });
		}
	},
	component: LoginRoute,
});

const forbiddenRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/forbidden',
	component: ForbiddenPage,
});

const authedRoute = createRoute({
	getParentRoute: () => rootRoute,
	id: '_authed',
	beforeLoad: ({ location }) => {
		requireAuth(location.href);
		requireRole(['SUPER_ADMIN']);
	},
	component: AuthedLayout,
});

const dashboardRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/',
	component: DashboardPage,
});

const tenantIndexRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/tenants',
	component: TenantsPage,
});

const tenantDetailRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/tenants/$tenantId',
	component: TenantDetailPage,
});

const routeTree = rootRoute.addChildren([
	loginRoute,
	forbiddenRoute,
	authedRoute.addChildren([dashboardRoute, tenantIndexRoute, tenantDetailRoute]),
]);

export const router = createRouter({
	routeTree,
	defaultPreload: 'intent',
});

declare module '@tanstack/react-router' {
	interface Register {
		router: typeof router;
	}
}
