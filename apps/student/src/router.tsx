import {
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	redirect,
} from '@tanstack/react-router';

import { Toaster } from '@repo/ui';

import { requireAuth, requireRole } from '@/lib/auth/guards';
import { STUDENT_ROLE } from '@/features/auth/hooks';
import { useSessionStore } from '@/store/sessionStore';
import { AuthedLayout } from '@/routes/authed-layout';
import { LoginRoute } from '@/routes/login';
import { ForbiddenPage } from '@/routes/forbidden';
import { HomeRoute } from '@/routes/home';
import { ScheduleRoute } from '@/routes/schedule';
import { SessionDetailRoute } from '@/routes/session-detail';
import { ProgressRoute } from '@/routes/progress';
import { LeaderboardRoute } from '@/routes/leaderboard';
import { parsePeriod } from '@/features/leaderboard/lib/period';
import type { LeaderboardPeriod } from '@/features/leaderboard/lib/period';
import { BillingRoute } from '@/routes/billing';
import type { BillingView } from '@/routes/billing';
import { InvoiceDetailRoute } from '@/routes/invoice-detail';
import { InboxRoute } from '@/routes/inbox';
import { NoteDetailRoute } from '@/routes/note-detail';
import { ProfileRoute } from '@/routes/profile';

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
		requireRole([STUDENT_ROLE]);
	},
	component: AuthedLayout,
});

const homeRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/',
	component: HomeRoute,
});

const scheduleRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/schedule',
	component: ScheduleRoute,
});

const sessionDetailRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/schedule/$sessionId',
	component: SessionDetailRoute,
});

const progressRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/progress',
	// Optional so plain `/progress` stays valid; absent means "all groups". A
	// non-numeric or non-positive value is dropped rather than sent to the API,
	// which would 400 on it.
	validateSearch: (search: Record<string, unknown>): { groupId?: number } => {
		const groupId = Number(search.groupId);
		return {
			groupId: Number.isInteger(groupId) && groupId > 0 ? groupId : undefined,
		};
	},
	component: ProgressRoute,
});

const leaderboardRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/leaderboard',
	// Both selectors live in the URL so back/forward restore what the student was
	// looking at. `groupId` is dropped when it isn't a positive integer (the
	// screen then falls back to the first rankable group rather than 400ing);
	// `period` always resolves to a valid window.
	validateSearch: (
		search: Record<string, unknown>,
	): { groupId?: number; period: LeaderboardPeriod } => {
		const groupId = Number(search.groupId);
		return {
			groupId: Number.isInteger(groupId) && groupId > 0 ? groupId : undefined,
			period: parsePeriod(search.period),
		};
	},
	component: LeaderboardRoute,
});

const billingRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/billing',
	// Optional so plain `/billing` navigations stay valid; the screen defaults to Invoices.
	validateSearch: (search: Record<string, unknown>): { view?: BillingView } => ({
		view:
			search.view === 'wallet'
				? 'wallet'
				: search.view === 'payments'
					? 'payments'
					: search.view === 'invoices'
						? 'invoices'
						: undefined,
	}),
	component: BillingRoute,
});

const invoiceDetailRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/billing/$invoiceId',
	component: InvoiceDetailRoute,
});

const inboxRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/inbox',
	component: InboxRoute,
});

const noteDetailRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/inbox/$noteId',
	component: NoteDetailRoute,
});

const profileRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/profile',
	component: ProfileRoute,
});

const routeTree = rootRoute.addChildren([
	loginRoute,
	forbiddenRoute,
	authedRoute.addChildren([
		homeRoute,
		scheduleRoute,
		sessionDetailRoute,
		progressRoute,
		leaderboardRoute,
		billingRoute,
		invoiceDetailRoute,
		inboxRoute,
		noteDetailRoute,
		profileRoute,
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
