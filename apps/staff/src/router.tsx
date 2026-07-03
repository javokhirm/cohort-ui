import {
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	redirect,
} from '@tanstack/react-router';

import { Toaster } from '@repo/ui';
import { requireAuth, requirePermission } from '@/lib/auth/guards';
import { LoginRoute } from '@/routes/login';
import { AuthedLayout } from '@/routes/authed-layout';
import { DashboardPage } from '@/routes/dashboard';
import { ForbiddenPage } from '@/routes/forbidden';
import { StudentsRoute } from '@/routes/_authed.students';
import { StudentDetailRoute } from '@/routes/_authed.students.$id';
import { StaffRoute } from '@/routes/_authed.staff';
import { StaffDetailRoute } from '@/routes/_authed.staff.$id';
import { StaffEditRoute } from '@/routes/_authed.staff.$id.edit';
import { RoomsRoute } from '@/routes/_authed.rooms';
import { FeePlansRoute } from '@/routes/_authed.fee-plans';
import { DiscountsRoute } from '@/routes/_authed.discounts';
import { InvoicesRoute } from '@/routes/_authed.invoices';
import { InvoiceDetailRoute } from '@/routes/_authed.invoices.$id';
import { BranchesRoute } from '@/routes/_authed.branches';
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
	beforeLoad: () => requirePermission('dashboard.read'),
	component: DashboardPage,
});

const studentsRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/students',
	beforeLoad: () => requirePermission('student.read'),
	component: StudentsRoute,
});

const studentDetailRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/students/$id',
	beforeLoad: () => requirePermission('student.read'),
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
	beforeLoad: () => requirePermission('staff.read'),
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
	beforeLoad: () => requirePermission('staff.read'),
	component: () => {
		const { staffId } = staffDetailRoute.useParams();
		return <StaffDetailRoute id={staffId} />;
	},
});

const staffEditRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/staff/$staffId/edit',
	beforeLoad: () => requirePermission('staff.update'),
	component: () => {
		const { staffId } = staffEditRoute.useParams();
		return <StaffEditRoute id={staffId} />;
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
	beforeLoad: () => requirePermission('room.read'),
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

type FeePlanStatusSearch = 'active' | 'inactive';

interface FeePlanSearch {
	page?: number;
	status?: FeePlanStatusSearch;
}

const feePlansRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/fee-plans',
	beforeLoad: () => requirePermission('fee-plan.manage'),
	validateSearch: (search: Record<string, unknown>): FeePlanSearch => {
		const page = Number(search.page);
		const status = search.status;
		return {
			page: Number.isFinite(page) && page > 0 ? page : undefined,
			status: status === 'active' || status === 'inactive' ? status : undefined,
		};
	},
	component: FeePlansRoute,
});

type DiscountStatusSearch = 'active' | 'inactive';

interface DiscountSearch {
	page?: number;
	status?: DiscountStatusSearch;
}

const discountsRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/discounts',
	beforeLoad: () => requirePermission('discount.manage'),
	validateSearch: (search: Record<string, unknown>): DiscountSearch => {
		const page = Number(search.page);
		const status = search.status;
		return {
			page: Number.isFinite(page) && page > 0 ? page : undefined,
			status: status === 'active' || status === 'inactive' ? status : undefined,
		};
	},
	component: DiscountsRoute,
});

type InvoiceStatusSearch =
	| 'DRAFT'
	| 'UNPAID'
	| 'PARTIAL'
	| 'PAID'
	| 'OVERDUE'
	| 'VOID'
	| 'REFUNDED';

const INVOICE_STATUSES: InvoiceStatusSearch[] = [
	'DRAFT',
	'UNPAID',
	'PARTIAL',
	'PAID',
	'OVERDUE',
	'VOID',
	'REFUNDED',
];

interface InvoiceSearch {
	page?: number;
	status?: InvoiceStatusSearch;
}

const invoicesRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/invoices',
	beforeLoad: () => requirePermission('invoice.read'),
	validateSearch: (search: Record<string, unknown>): InvoiceSearch => {
		const page = Number(search.page);
		const status = search.status;
		return {
			page: Number.isFinite(page) && page > 0 ? page : undefined,
			status: INVOICE_STATUSES.includes(status as InvoiceStatusSearch)
				? (status as InvoiceStatusSearch)
				: undefined,
		};
	},
	component: InvoicesRoute,
});

const invoiceDetailRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/invoices/$id',
	beforeLoad: () => requirePermission('invoice.read'),
	component: () => {
		const { id } = invoiceDetailRoute.useParams();
		return <InvoiceDetailRoute id={id} />;
	},
});

const branchesRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/branches',
	beforeLoad: () => requirePermission('branch.read'),
	component: BranchesRoute,
});

const coursesRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/courses',
	beforeLoad: () => requirePermission('course.read'),
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
	beforeLoad: () => requirePermission('course.read'),
	component: () => {
		const { courseId } = courseDetailRoute.useParams();
		return <CourseDetailRoute id={courseId} />;
	},
});

type GroupStatusSearch = 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

interface GroupSearch {
	page?: number;
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
	beforeLoad: () => requirePermission('group.read'),
	validateSearch: (search: Record<string, unknown>): GroupSearch => {
		const page = Number(search.page);
		const courseId = Number(search.courseId);
		const status = search.status;
		return {
			page: Number.isFinite(page) && page > 0 ? page : undefined,
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
	beforeLoad: () => requirePermission('group.create'),
	component: GroupCreateRoute,
});

const groupDetailRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/groups/$groupId',
	beforeLoad: () => requirePermission('group.read'),
	component: () => {
		const { groupId } = groupDetailRoute.useParams();
		return <GroupDetailRoute id={groupId} />;
	},
});

const groupEditRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/groups/$groupId/edit',
	beforeLoad: () => requirePermission('group.update'),
	component: () => {
		const { groupId } = groupEditRoute.useParams();
		return <GroupEditRoute id={groupId} />;
	},
});

type SessionStatusSearch = 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
type ScheduleViewSearch = 'week' | 'month';

interface ScheduleSearch {
	date?: string;
	status?: SessionStatusSearch;
	view?: ScheduleViewSearch;
}

const SESSION_STATUSES: SessionStatusSearch[] = ['SCHEDULED', 'COMPLETED', 'CANCELLED'];
const SCHEDULE_VIEWS: ScheduleViewSearch[] = ['week', 'month'];

const scheduleRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/schedule',
	beforeLoad: () => requirePermission('session.read'),
	validateSearch: (search: Record<string, unknown>): ScheduleSearch => {
		const status = search.status;
		const view = search.view;
		const date =
			typeof search.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(search.date)
				? search.date
				: undefined;
		return {
			date,
			status: SESSION_STATUSES.includes(status as SessionStatusSearch)
				? (status as SessionStatusSearch)
				: undefined,
			view: SCHEDULE_VIEWS.includes(view as ScheduleViewSearch)
				? (view as ScheduleViewSearch)
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
	beforeLoad: () => requirePermission('payroll.read'),
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
		staffEditRoute,
		roomsRoute,
		feePlansRoute,
		discountsRoute,
		invoicesRoute,
		invoiceDetailRoute,
		branchesRoute,
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
