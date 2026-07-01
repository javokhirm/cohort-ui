import {
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	redirect,
} from '@tanstack/react-router';

import { Toaster } from '@repo/ui';
import { requireAuth } from '@/lib/auth/guards';
import { LoginRoute } from '@/routes/login';
import { AuthedLayout } from '@/routes/authed-layout';
import { DashboardPage } from '@/routes/dashboard';
import { ForbiddenPage } from '@/routes/forbidden';
import { StudentsRoute } from '@/routes/_authed.students';
import { StudentDetailRoute } from '@/routes/_authed.students.$id';
import { StaffRoute } from '@/routes/_authed.staff';
import { StaffDetailRoute } from '@/routes/_authed.staff.$id';
import { PayrollRoute } from '@/routes/_authed.payroll';
import { useSessionStore } from '@/store/sessionStore';

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
	},
	component: AuthedLayout,
});

const dashboardRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/',
	component: DashboardPage,
});

const studentsRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/students',
	component: StudentsRoute,
});

const studentDetailRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/students/$id',
	component: () => {
		const { id } = studentDetailRoute.useParams();
		return <StudentDetailRoute id={id} />;
	},
});

type StaffRoleSearch = 'TEACHER' | 'MANAGER' | 'ADMIN';

interface StaffSearch {
	page?: number;
	search?: string;
	role?: StaffRoleSearch;
}

const staffRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/staff',
	validateSearch: (search: Record<string, unknown>): StaffSearch => {
		const page = Number(search.page);
		const role = search.role;
		return {
			page: Number.isFinite(page) && page > 0 ? page : undefined,
			search: typeof search.search === 'string' ? search.search : undefined,
			role:
				role === 'TEACHER' || role === 'MANAGER' || role === 'ADMIN'
					? role
					: undefined,
		};
	},
	component: StaffRoute,
});

const staffDetailRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/staff/$staffId',
	component: () => {
		const { staffId } = staffDetailRoute.useParams();
		return <StaffDetailRoute id={staffId} />;
	},
});

type PayrollStatusSearch = 'DRAFT' | 'APPROVED' | 'PAID';

interface PayrollSearch {
	page?: number;
	status?: PayrollStatusSearch;
}

const payrollRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/payroll',
	validateSearch: (search: Record<string, unknown>): PayrollSearch => {
		const page = Number(search.page);
		const status = search.status;
		return {
			page: Number.isFinite(page) && page > 0 ? page : undefined,
			status:
				status === 'DRAFT' || status === 'APPROVED' || status === 'PAID'
					? status
					: undefined,
		};
	},
	component: PayrollRoute,
});

const routeTree = rootRoute.addChildren([
	loginRoute,
	forbiddenRoute,
	authedRoute.addChildren([
		dashboardRoute,
		studentsRoute,
		studentDetailRoute,
		staffRoute,
		staffDetailRoute,
		payrollRoute,
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
