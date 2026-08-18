import {
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	redirect,
} from '@tanstack/react-router';

import { Toaster } from '@repo/ui';
import { requireAuth, requireRole } from './lib/auth/guards';
import { LoginRoute } from './routes/login';
import { AuthedLayout } from './routes/authed-layout';
import { DashboardPage } from './routes/dashboard';
import { TenantsPage } from './routes/tenants/index';
import { ImportSessionPage } from './routes/tenants/$tenantId/imports/$sessionId';
import { TenantDetailPage } from './routes/tenants/$tenantId/index';
import { OnboardTenantPage } from './routes/tenants/onboard';
import { SubscriptionPlansPage } from './routes/subscription-plans/index';
import { SubscriptionsPage } from './routes/subscriptions/index';
import { SubscriptionPaymentsPage } from './routes/subscription-payments/index';
import { SubscriptionInvoicesPage } from './routes/subscription-invoices/index';
import { LeadsPage } from './routes/leads/index';
import { UserDirectoryPage } from './routes/users/index';
import { UserDetailPage } from './routes/users/$userId/index';
import { ProfilePage } from './routes/profile/index';
import { AuditLogPage } from './routes/audit-log/index';
import { AuditLogDetailPage } from './routes/audit-log/$auditId/index';
import { RoleTemplatesPage } from './routes/roles/index';
import { SettingsPage } from './routes/settings/index';
import { ForbiddenPage } from './routes/forbidden';
import { useSessionStore } from './store/sessionStore';

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

const tenantOnboardRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/tenants/onboard',
	component: OnboardTenantPage,
});

/**
 * One CSV student-import session (api-reference §2.9). `sessionId` is a UUID, not
 * a numeric id — sessions live in Redis under a TTL rather than in a table.
 */
const importSessionRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/tenants/$tenantId/imports/$sessionId',
	component: ImportSessionPage,
});

const subscriptionPlansRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/subscription-plans',
	component: SubscriptionPlansPage,
});

const subscriptionsRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/subscriptions',
	validateSearch: (
		search: Record<string, unknown>,
	): { page?: number; status?: 'TRIALING' | 'ACTIVE' | 'PAST_DUE' | 'CANCELLED' } => {
		const VALID = ['TRIALING', 'ACTIVE', 'PAST_DUE', 'CANCELLED'] as const;
		type S = (typeof VALID)[number];
		const status = VALID.includes(search.status as S)
			? (search.status as S)
			: undefined;
		const page =
			typeof search.page === 'number' &&
			Number.isFinite(search.page) &&
			search.page >= 1
				? Math.floor(search.page)
				: undefined;
		return { status, page };
	},
	component: SubscriptionsPage,
});

const subscriptionPaymentsRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/subscription-payments',
	validateSearch: (
		search: Record<string, unknown>,
	): {
		page?: number;
		tenantId?: number;
		status?: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
		method?: 'CLICK' | 'PAYME' | 'UZUM' | 'BANK_TRANSFER' | 'CASH';
		search?: string;
		from?: string;
		to?: string;
	} => {
		const STATUSES = ['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'] as const;
		const METHODS = ['CLICK', 'PAYME', 'UZUM', 'BANK_TRANSFER', 'CASH'] as const;
		type St = (typeof STATUSES)[number];
		type Me = (typeof METHODS)[number];
		const page =
			typeof search.page === 'number' &&
			Number.isFinite(search.page) &&
			search.page >= 1
				? Math.floor(search.page)
				: undefined;
		const tenantId =
			typeof search.tenantId === 'number' &&
			Number.isFinite(search.tenantId) &&
			search.tenantId >= 1
				? Math.floor(search.tenantId)
				: undefined;
		const status = STATUSES.includes(search.status as St)
			? (search.status as St)
			: undefined;
		const method = METHODS.includes(search.method as Me)
			? (search.method as Me)
			: undefined;
		const q =
			typeof search.search === 'string' && search.search.trim()
				? search.search.trim()
				: undefined;
		const from = typeof search.from === 'string' ? search.from : undefined;
		const to = typeof search.to === 'string' ? search.to : undefined;
		return { page, tenantId, status, method, search: q, from, to };
	},
	component: SubscriptionPaymentsPage,
});

const subscriptionInvoicesRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/subscription-invoices',
	validateSearch: (
		search: Record<string, unknown>,
	): {
		page?: number;
		tenantId?: number;
		status?: 'PAID' | 'UNPAID' | 'FAILED' | 'REFUNDED';
		from?: string;
		to?: string;
	} => {
		const STATUSES = ['PAID', 'UNPAID', 'FAILED', 'REFUNDED'] as const;
		type St = (typeof STATUSES)[number];
		const page =
			typeof search.page === 'number' &&
			Number.isFinite(search.page) &&
			search.page >= 1
				? Math.floor(search.page)
				: undefined;
		const tenantId =
			typeof search.tenantId === 'number' &&
			Number.isFinite(search.tenantId) &&
			search.tenantId >= 1
				? Math.floor(search.tenantId)
				: undefined;
		const status = STATUSES.includes(search.status as St)
			? (search.status as St)
			: undefined;
		const from = typeof search.from === 'string' ? search.from : undefined;
		const to = typeof search.to === 'string' ? search.to : undefined;
		return { page, tenantId, status, from, to };
	},
	component: SubscriptionInvoicesPage,
});

const userIndexRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/users',
	validateSearch: (
		search: Record<string, unknown>,
	): { page?: number; search?: string } => {
		const page =
			typeof search.page === 'number' &&
			Number.isFinite(search.page) &&
			search.page >= 1
				? Math.floor(search.page)
				: undefined;
		const q =
			typeof search.search === 'string' && search.search.trim()
				? search.search.trim()
				: undefined;
		return { page, search: q };
	},
	component: UserDirectoryPage,
});

const userDetailRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/users/$userId',
	component: UserDetailPage,
});

const leadsRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/leads',
	validateSearch: (
		search: Record<string, unknown>,
	): { page?: number; search?: string; source?: string } => {
		const page =
			typeof search.page === 'number' &&
			Number.isFinite(search.page) &&
			search.page >= 1
				? Math.floor(search.page)
				: undefined;
		const q =
			typeof search.search === 'string' && search.search.trim()
				? search.search.trim()
				: undefined;
		const source =
			typeof search.source === 'string' && search.source.trim()
				? search.source.trim()
				: undefined;
		return { page, search: q, source };
	},
	component: LeadsPage,
});

const profileRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/profile',
	component: ProfilePage,
});

const auditLogRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/audit-log',
	component: AuditLogPage,
});

const auditLogDetailRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/audit-log/$auditId',
	component: AuditLogDetailPage,
});

const roleTemplatesRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/roles',
	component: RoleTemplatesPage,
});

const settingsRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/settings',
	component: SettingsPage,
});

const routeTree = rootRoute.addChildren([
	loginRoute,
	forbiddenRoute,
	authedRoute.addChildren([
		dashboardRoute,
		tenantIndexRoute,
		tenantOnboardRoute,
		// More specific than `/tenants/$tenantId`, so it is registered before it.
		importSessionRoute,
		tenantDetailRoute,
		subscriptionPlansRoute,
		subscriptionsRoute,
		subscriptionPaymentsRoute,
		subscriptionInvoicesRoute,
		userIndexRoute,
		userDetailRoute,
		leadsRoute,
		profileRoute,
		auditLogRoute,
		auditLogDetailRoute,
		roleTemplatesRoute,
		settingsRoute,
	]),
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
