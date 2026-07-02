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
import { RoomsRoute } from '@/routes/_authed.rooms';
import { CoursesRoute } from '@/routes/_authed.courses';
import { CourseDetailRoute } from '@/routes/_authed.courses.$id';
import { GroupsRoute } from '@/routes/_authed.groups';
import { GroupCreateRoute } from '@/routes/_authed.groups.new';
import { GroupDetailRoute } from '@/routes/_authed.groups.$id';
import { GroupEditRoute } from '@/routes/_authed.groups.$id.edit';
import { ScheduleRoute } from '@/routes/_authed.schedule';
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

type RoomStatusSearch = 'active' | 'inactive';

interface RoomSearch {
	page?: number;
	status?: RoomStatusSearch;
}

const roomsRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/rooms',
	validateSearch: (search: Record<string, unknown>): RoomSearch => {
		const page = Number(search.page);
		const status = search.status;
		return {
			page: Number.isFinite(page) && page > 0 ? page : undefined,
			status: status === 'active' || status === 'inactive' ? status : undefined,
		};
	},
	component: RoomsRoute,
});

type CourseStatusSearch = 'active' | 'inactive';

interface CourseSearch {
	page?: number;
	search?: string;
	status?: CourseStatusSearch;
}

const coursesRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/courses',
	validateSearch: (search: Record<string, unknown>): CourseSearch => {
		const page = Number(search.page);
		const status = search.status;
		return {
			page: Number.isFinite(page) && page > 0 ? page : undefined,
			search: typeof search.search === 'string' ? search.search : undefined,
			status: status === 'active' || status === 'inactive' ? status : undefined,
		};
	},
	component: CoursesRoute,
});

const courseDetailRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/courses/$courseId',
	component: () => {
		const { courseId } = courseDetailRoute.useParams();
		return <CourseDetailRoute id={courseId} />;
	},
});

type GroupStatusSearch = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

interface GroupSearch {
	page?: number;
	branchId?: number;
	courseId?: number;
	status?: GroupStatusSearch;
}

const GROUP_STATUSES: GroupStatusSearch[] = [
	'PLANNED',
	'ACTIVE',
	'COMPLETED',
	'CANCELLED',
];

const groupsRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/groups',
	validateSearch: (search: Record<string, unknown>): GroupSearch => {
		const page = Number(search.page);
		const branchId = Number(search.branchId);
		const courseId = Number(search.courseId);
		const status = search.status;
		return {
			page: Number.isFinite(page) && page > 0 ? page : undefined,
			branchId: Number.isFinite(branchId) && branchId > 0 ? branchId : undefined,
			courseId: Number.isFinite(courseId) && courseId > 0 ? courseId : undefined,
			status: GROUP_STATUSES.includes(status as GroupStatusSearch)
				? (status as GroupStatusSearch)
				: undefined,
		};
	},
	component: GroupsRoute,
});

const groupNewRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/groups/new',
	component: GroupCreateRoute,
});

const groupDetailRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/groups/$groupId',
	component: () => {
		const { groupId } = groupDetailRoute.useParams();
		return <GroupDetailRoute id={groupId} />;
	},
});

const groupEditRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/groups/$groupId/edit',
	component: () => {
		const { groupId } = groupEditRoute.useParams();
		return <GroupEditRoute id={groupId} />;
	},
});

type SessionStatusSearch = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';

interface ScheduleSearch {
	date?: string;
	branchId?: number;
	status?: SessionStatusSearch;
}

const SESSION_STATUSES: SessionStatusSearch[] = ['SCHEDULED', 'COMPLETED', 'CANCELLED'];

const scheduleRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/schedule',
	validateSearch: (search: Record<string, unknown>): ScheduleSearch => {
		const branchId = Number(search.branchId);
		const status = search.status;
		const date =
			typeof search.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(search.date)
				? search.date
				: undefined;
		return {
			date,
			branchId: Number.isFinite(branchId) && branchId > 0 ? branchId : undefined,
			status: SESSION_STATUSES.includes(status as SessionStatusSearch)
				? (status as SessionStatusSearch)
				: undefined,
		};
	},
	component: ScheduleRoute,
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
		roomsRoute,
		coursesRoute,
		courseDetailRoute,
		groupsRoute,
		groupNewRoute,
		groupDetailRoute,
		groupEditRoute,
		scheduleRoute,
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
