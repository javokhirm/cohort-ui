import {
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	redirect,
} from '@tanstack/react-router';

import { Toaster } from '@repo/ui';

import { requireAuth, requireRole } from '@/lib/auth/guards';
import { TEACHER_ROLE } from '@/features/auth/hooks';
import { useSessionStore } from '@/store/sessionStore';
import { AuthedLayout } from '@/routes/authed-layout';
import { LoginRoute } from '@/routes/login';
import { ForbiddenPage } from '@/routes/forbidden';
import { TodayRoute } from '@/routes/today';
import { GroupsRoute } from '@/routes/groups';
import { ProfileRoute } from '@/routes/profile';
import { SessionDetailRoute } from '@/routes/session-detail';
import { AttendanceRoute } from '@/routes/attendance';
import { GroupAttendanceRoute } from '@/routes/group-attendance';
import { MarksRoute } from '@/routes/marks';
import { GroupMarksRoute } from '@/routes/group-marks';

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
		requireRole([TEACHER_ROLE]);
	},
	component: AuthedLayout,
});

const todayRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/',
	component: TodayRoute,
});

const groupsRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/groups',
	component: GroupsRoute,
});

const profileRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/profile',
	component: ProfileRoute,
});

const sessionDetailRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/sessions/$sessionId',
	component: SessionDetailRoute,
});

const attendanceRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/sessions/$sessionId/attendance',
	validateSearch: (search: Record<string, unknown>): { view?: 'list' } => {
		const view = search.view === 'list' ? 'list' : undefined;
		return { view };
	},
	component: AttendanceRoute,
});

const marksRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/sessions/$sessionId/marks',
	validateSearch: (search: Record<string, unknown>): { view?: 'list' } => {
		const view = search.view === 'list' ? 'list' : undefined;
		return { view };
	},
	component: MarksRoute,
});

const groupAttendanceRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/groups/$groupId/attendance',
	validateSearch: (
		search: Record<string, unknown>,
	): { month?: string; view?: 'table' } => {
		const month =
			typeof search.month === 'string' &&
			/^\d{4}-(0[1-9]|1[0-2])$/.test(search.month)
				? search.month
				: undefined;
		const view = search.view === 'table' ? 'table' : undefined;
		return { month, view };
	},
	component: GroupAttendanceRoute,
});

const groupMarksRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/groups/$groupId/marks',
	validateSearch: (
		search: Record<string, unknown>,
	): { month?: string; view?: 'table' } => {
		const month =
			typeof search.month === 'string' &&
			/^\d{4}-(0[1-9]|1[0-2])$/.test(search.month)
				? search.month
				: undefined;
		const view = search.view === 'table' ? 'table' : undefined;
		return { month, view };
	},
	component: GroupMarksRoute,
});

const routeTree = rootRoute.addChildren([
	loginRoute,
	forbiddenRoute,
	authedRoute.addChildren([
		todayRoute,
		groupsRoute,
		profileRoute,
		sessionDetailRoute,
		attendanceRoute,
		marksRoute,
		groupAttendanceRoute,
		groupMarksRoute,
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
