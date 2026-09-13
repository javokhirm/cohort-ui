import {
	createRootRoute,
	createRoute,
	createRouter,
	Outlet,
	redirect,
} from '@tanstack/react-router';

import { Toaster } from '@repo/ui';
import {
	requireAuth,
	requirePermission,
	requireSubscriptionAccess,
} from '@/lib/auth/guards';
import { LoginRoute } from '@/routes/login';
import { AuthedLayout } from '@/routes/authed-layout';
import { DashboardPage } from '@/routes/dashboard';
import { ForbiddenPage } from '@/routes/forbidden';
import { SubscriptionRoute } from '@/routes/subscription';
import { StudentsRoute } from '@/routes/_authed.students';
import { StudentDetailRoute } from '@/routes/_authed.students.$id';
import { StaffRoute } from '@/routes/_authed.staff';
import { StaffDetailRoute } from '@/routes/_authed.staff.$id';
import { StaffEditRoute } from '@/routes/_authed.staff.$id.edit';
import { RoomsRoute } from '@/routes/_authed.rooms';
import { FeePlansRoute } from '@/routes/_authed.fee-plans';
import { BillingPolicyRoute } from '@/routes/_authed.billing-policy';
import { DiscountsRoute } from '@/routes/_authed.discounts';
import { InvoicesRoute } from '@/routes/_authed.invoices';
import { InvoiceDetailRoute } from '@/routes/_authed.invoices.$id';
import { BranchesRoute } from '@/routes/_authed.branches';
import { NotificationsRoute } from '@/routes/_authed.notifications';
import { CoursesRoute } from '@/routes/_authed.courses';
import { CourseDetailRoute } from '@/routes/_authed.courses.$id';
import { GroupsRoute } from '@/routes/_authed.groups';
import { GroupCreateRoute } from '@/routes/_authed.groups.new';
import { GroupDetailRoute } from '@/routes/_authed.groups.$id';
import { GroupEditRoute } from '@/routes/_authed.groups.$id.edit';
import { WeeklyScheduleRoute } from '@/routes/_authed.schedule.week';
import { MonthlyScheduleRoute } from '@/routes/_authed.schedule.month';
import { RoomAvailabilityRoute } from '@/routes/_authed.schedule.rooms';
import { PayrollRoute } from '@/routes/_authed.payroll';
import { PayrollDetailRoute } from '@/routes/_authed.payroll.$staffId';
import { ExpensesRoute } from '@/routes/_authed.expenses';
import { PaymentsRoute } from '@/routes/_authed.payments';
import { LeadsRoute } from '@/routes/_authed.leads';
import { AccountRoute } from '@/routes/_authed.account';
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

/**
 * The global 402 block's landing screen (root CLAUDE.md task). Deliberately a
 * top-level route — not nested under `authedRoute`/`AuthedLayout` — so it
 * renders standalone, without the sidebar/branch-selector chrome that would
 * fire their own manage-surface requests (and 402 again) while the tenant is
 * blocked. Reachable any time, not just while blocked: it is also where an
 * OWNER/ADMIN checks billing history or changes plan.
 */
const subscriptionRoute = createRoute({
	getParentRoute: () => rootRoute,
	path: '/subscription',
	beforeLoad: ({ location }) => requireAuth(location.href),
	component: SubscriptionRoute,
});

const authedRoute = createRoute({
	getParentRoute: () => rootRoute,
	id: '_authed',
	beforeLoad: ({ location }) => {
		requireAuth(location.href);
		// Runs for every nested route, including one reached by typing a URL
		// directly — the "must not be able to escape it" requirement.
		requireSubscriptionAccess(location.pathname);
	},
	component: AuthedLayout,
});

const dashboardRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/',
	beforeLoad: () => requirePermission('dashboard.read'),
	component: DashboardPage,
});

type StudentStatusSearch = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'SUSPENDED';

const STUDENT_STATUSES: StudentStatusSearch[] = [
	'ALL',
	'ACTIVE',
	'INACTIVE',
	'GRADUATED',
	'SUSPENDED',
];

interface StudentSearch {
	page?: number;
	search?: string;
	status?: StudentStatusSearch;
}

const studentsRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/students',
	beforeLoad: () => requirePermission('student.read'),
	// Page, search and status live in the URL like every other list, so coming
	// back from a student — via the screen's Back control or the browser's own
	// gesture — lands on the page and filter that was left, not on page 1.
	validateSearch: (search: Record<string, unknown>): StudentSearch => {
		const page = Number(search.page);
		const status = search.status;
		const term = search.search;
		return {
			page: Number.isFinite(page) && page > 0 ? page : undefined,
			search: typeof term === 'string' && term.trim() ? term : undefined,
			// `ACTIVE` is the screen's default view and is normalised away, so
			// `/students` and `/students?status=ACTIVE` stay one URL.
			status:
				STUDENT_STATUSES.includes(status as StudentStatusSearch) &&
				status !== 'ACTIVE'
					? (status as StudentStatusSearch)
					: undefined,
		};
	},
	component: StudentsRoute,
});

type StudentTabSearch =
	| 'overview'
	| 'guardians'
	| 'enrollments'
	| 'performance'
	| 'grades'
	| 'billing'
	| 'wallet';

const STUDENT_TABS: StudentTabSearch[] = [
	'overview',
	'guardians',
	'enrollments',
	'performance',
	'grades',
	'billing',
	'wallet',
];

const studentDetailRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/students/$id',
	beforeLoad: () => requirePermission('student.read'),
	// The open tab is URL state, as on the group screen: an admin who opens an
	// invoice from the billing tab and comes back should land on billing, not
	// be dropped back to the overview. `overview` is the default and is
	// normalised away so the bare URL stays canonical.
	validateSearch: (search: Record<string, unknown>): { tab?: StudentTabSearch } => {
		const tab = search.tab;
		return {
			tab:
				STUDENT_TABS.includes(tab as StudentTabSearch) && tab !== 'overview'
					? (tab as StudentTabSearch)
					: undefined,
		};
	},
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

type StaffTabSearch = 'overview' | 'roles' | 'payroll' | 'activity';

const STAFF_TABS: StaffTabSearch[] = ['overview', 'roles', 'payroll', 'activity'];

const staffDetailRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/staff/$staffId',
	beforeLoad: () => requirePermission('staff.read'),
	// Tab in the URL, like the student and group screens — a round trip out to
	// the payroll period and back reopens the payroll tab it was launched from.
	validateSearch: (search: Record<string, unknown>): { tab?: StaffTabSearch } => {
		const tab = search.tab;
		return {
			tab:
				STAFF_TABS.includes(tab as StaffTabSearch) && tab !== 'overview'
					? (tab as StaffTabSearch)
					: undefined,
		};
	},
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

/**
 * The signed-in member's own account (profile + change password). Deliberately
 * carries no `requirePermission` — every staff member may manage their own
 * credential, mirroring the server, where `/manage/me` is the one route with no
 * permission gate. Changing *someone else's* password is a separate action on the
 * staff detail route, behind `staff.update`.
 */
const accountRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/account',
	component: AccountRoute,
});

type RoomStatusSearch = 'active' | 'inactive';

interface RoomSearch {
	status?: RoomStatusSearch;
}

const roomsRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/rooms',
	beforeLoad: () => requirePermission('room.read'),
	validateSearch: (search: Record<string, unknown>): RoomSearch => {
		const status = search.status;
		return {
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

const billingPolicyRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/billing-policy',
	beforeLoad: () => requirePermission('billing-policy.view'),
	component: BillingPolicyRoute,
});

type DiscountStatusSearch = 'active' | 'inactive';

interface DiscountSearch {
	status?: DiscountStatusSearch;
	search?: string;
}

const discountsRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/discounts',
	beforeLoad: () => requirePermission('discount.manage'),
	validateSearch: (search: Record<string, unknown>): DiscountSearch => {
		const status = search.status;
		return {
			status: status === 'active' || status === 'inactive' ? status : undefined,
			search: typeof search.search === 'string' ? search.search : undefined,
		};
	},
	component: DiscountsRoute,
});

type InvoiceStatusSearch = 'DRAFT' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'VOID';

const INVOICE_STATUSES: InvoiceStatusSearch[] = [
	'DRAFT',
	'UNPAID',
	'PARTIAL',
	'PAID',
	'OVERDUE',
	'VOID',
];

interface InvoiceSearch {
	page?: number;
	status?: InvoiceStatusSearch;
	studentId?: number;
	groupId?: number;
	from?: string;
	to?: string;
	dueBefore?: string;
}

const invoicesRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/invoices',
	beforeLoad: () => requirePermission('invoice.read'),
	validateSearch: (search: Record<string, unknown>): InvoiceSearch => {
		const page = Number(search.page);
		const status = search.status;
		const studentId = Number(search.studentId);
		const groupId = Number(search.groupId);
		const from = search.from;
		const to = search.to;
		const dueBefore = search.dueBefore;
		return {
			page: Number.isFinite(page) && page > 0 ? page : undefined,
			status: INVOICE_STATUSES.includes(status as InvoiceStatusSearch)
				? (status as InvoiceStatusSearch)
				: undefined,
			studentId:
				Number.isFinite(studentId) && studentId > 0 ? studentId : undefined,
			groupId: Number.isFinite(groupId) && groupId > 0 ? groupId : undefined,
			from:
				typeof from === 'string' && ISO_DATE_SEARCH.test(from) ? from : undefined,
			to: typeof to === 'string' && ISO_DATE_SEARCH.test(to) ? to : undefined,
			dueBefore:
				typeof dueBefore === 'string' && ISO_DATE_SEARCH.test(dueBefore)
					? dueBefore
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

type PaymentMethodSearch =
	'CASH' | 'CLICK' | 'PAYME' | 'UZUM' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT';
type PaymentStatusSearch = 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';

const PAYMENT_METHODS: PaymentMethodSearch[] = [
	'CASH',
	'CLICK',
	'PAYME',
	'UZUM',
	'CARD',
	'BANK_TRANSFER',
	'CREDIT',
];

const PAYMENT_STATUSES: PaymentStatusSearch[] = [
	'PENDING',
	'SUCCEEDED',
	'FAILED',
	'REFUNDED',
];

interface PaymentSearch {
	page?: number;
	status?: PaymentStatusSearch;
	method?: PaymentMethodSearch;
	studentId?: number;
	from?: string;
	to?: string;
}

const paymentsRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/payments',
	beforeLoad: () => requirePermission('payment.read'),
	validateSearch: (search: Record<string, unknown>): PaymentSearch => {
		const page = Number(search.page);
		const status = search.status;
		const method = search.method;
		const studentId = Number(search.studentId);
		const from = search.from;
		const to = search.to;
		return {
			page: Number.isFinite(page) && page > 0 ? page : undefined,
			status: PAYMENT_STATUSES.includes(status as PaymentStatusSearch)
				? (status as PaymentStatusSearch)
				: undefined,
			method: PAYMENT_METHODS.includes(method as PaymentMethodSearch)
				? (method as PaymentMethodSearch)
				: undefined,
			studentId:
				Number.isFinite(studentId) && studentId > 0 ? studentId : undefined,
			from:
				typeof from === 'string' && ISO_DATE_SEARCH.test(from) ? from : undefined,
			to: typeof to === 'string' && ISO_DATE_SEARCH.test(to) ? to : undefined,
		};
	},
	component: PaymentsRoute,
});

const branchesRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/branches',
	beforeLoad: () => requirePermission('branch.read'),
	component: BranchesRoute,
});

/**
 * The communication console. Guarded on *any* of the four communication
 * permissions, because the page is a tab shell and each tab gates itself — an
 * ADMIN without `notification-settings.manage` (OWNER-only) still belongs here for
 * the other three.
 */
const notificationsRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/notifications',
	beforeLoad: () =>
		requirePermission([
			'notification-rule.manage',
			'notification-template.manage',
			'notification.send',
			'notification-settings.manage',
		]),
	component: NotificationsRoute,
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

type GroupTabSearch = 'students' | 'schedule';

const GROUP_TABS: GroupTabSearch[] = ['students', 'schedule'];

const groupDetailRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/groups/$groupId',
	beforeLoad: () => requirePermission('group.read'),
	// The open tab is URL state so the screen is linkable and survives a round
	// trip out to a student or the edit form. `students` is the default and is
	// normalised away, so `/groups/7` and `/groups/7?tab=students` are one URL.
	validateSearch: (search: Record<string, unknown>): { tab?: GroupTabSearch } => {
		const tab = search.tab;
		return {
			tab:
				GROUP_TABS.includes(tab as GroupTabSearch) && tab !== 'students'
					? (tab as GroupTabSearch)
					: undefined,
		};
	},
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
/** Which rooms the room screen lists; in the URL so a filtered day is shareable. */
type RoomFilterSearch = 'all' | 'booked' | 'conflicts';

/** Shared by the two calendar screens — they differ only in the range they draw. */
interface ScheduleCalendarSearch {
	date?: string;
	status?: SessionStatusSearch;
}

interface RoomAvailabilitySearch {
	date?: string;
	roomFilter?: RoomFilterSearch;
}

const SESSION_STATUSES: SessionStatusSearch[] = ['SCHEDULED', 'COMPLETED', 'CANCELLED'];
const ROOM_FILTERS: RoomFilterSearch[] = ['all', 'booked', 'conflicts'];

function validateScheduleCalendarSearch(
	search: Record<string, unknown>,
): ScheduleCalendarSearch {
	const status = search.status;
	return {
		date:
			typeof search.date === 'string' && ISO_DATE_SEARCH.test(search.date)
				? search.date
				: undefined,
		status: SESSION_STATUSES.includes(status as SessionStatusSearch)
			? (status as SessionStatusSearch)
			: undefined,
	};
}

/**
 * `/schedule` is not a screen — the three views it used to multiplex are three
 * destinations now, each named in the sidebar. The bare path stays as a redirect
 * so old links (and the `?view=` ones that preceded them) still land somewhere
 * sensible rather than 404ing.
 */
const scheduleIndexRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/schedule',
	beforeLoad: () => {
		requirePermission('session.read');
		throw redirect({ to: '/schedule/week' });
	},
});

const scheduleWeekRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/schedule/week',
	beforeLoad: () => requirePermission('session.read'),
	validateSearch: validateScheduleCalendarSearch,
	component: WeeklyScheduleRoute,
});

const scheduleMonthRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/schedule/month',
	beforeLoad: () => requirePermission('session.read'),
	validateSearch: validateScheduleCalendarSearch,
	component: MonthlyScheduleRoute,
});

const scheduleRoomsRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/schedule/rooms',
	beforeLoad: () => requirePermission('session.read'),
	validateSearch: (search: Record<string, unknown>): RoomAvailabilitySearch => {
		const roomFilter = search.roomFilter;
		return {
			date:
				typeof search.date === 'string' && ISO_DATE_SEARCH.test(search.date)
					? search.date
					: undefined,
			roomFilter: ROOM_FILTERS.includes(roomFilter as RoomFilterSearch)
				? (roomFilter as RoomFilterSearch)
				: undefined,
		};
	},
	component: RoomAvailabilityRoute,
});

type PayrollStatusSearch = 'LIVE' | 'FINALIZED' | 'PAID';

const PAYROLL_STATUSES: PayrollStatusSearch[] = ['LIVE', 'FINALIZED', 'PAID'];

/** `YYYY-MM` payroll period key. */
const MONTH_SEARCH = /^\d{4}-(0[1-9]|1[0-2])$/;

interface PayrollSearch {
	month?: string;
	status?: PayrollStatusSearch;
	staffId?: number;
}

const payrollRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/payroll',
	beforeLoad: () => requirePermission('payroll.read'),
	validateSearch: (search: Record<string, unknown>): PayrollSearch => {
		const month = search.month;
		const status = search.status;
		const staffId = Number(search.staffId);
		return {
			// The page falls back to the current Tashkent month when absent.
			month:
				typeof month === 'string' && MONTH_SEARCH.test(month) ? month : undefined,
			status: PAYROLL_STATUSES.includes(status as PayrollStatusSearch)
				? (status as PayrollStatusSearch)
				: undefined,
			staffId: Number.isFinite(staffId) && staffId > 0 ? staffId : undefined,
		};
	},
	component: PayrollRoute,
});

const payrollDetailRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/payroll/$staffId',
	beforeLoad: () => requirePermission('payroll.read'),
	validateSearch: (search: Record<string, unknown>): { month?: string } => {
		const month = search.month;
		return {
			month:
				typeof month === 'string' && MONTH_SEARCH.test(month) ? month : undefined,
		};
	},
	component: () => {
		const { staffId } = payrollDetailRoute.useParams();
		const { month } = payrollDetailRoute.useSearch();
		return <PayrollDetailRoute staffId={staffId} month={month} />;
	},
});

type ExpenseCategorySearch = 'RENT' | 'UTILITIES' | 'MARKETING' | 'SALARY' | 'OTHER';

const EXPENSE_CATEGORIES_SEARCH: ExpenseCategorySearch[] = [
	'RENT',
	'UTILITIES',
	'MARKETING',
	'SALARY',
	'OTHER',
];

const ISO_DATE_SEARCH = /^\d{4}-\d{2}-\d{2}$/;

interface ExpenseSearch {
	page?: number;
	category?: ExpenseCategorySearch;
	from?: string;
	to?: string;
}

const expensesRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/expenses',
	beforeLoad: () => requirePermission('expense.read'),
	validateSearch: (search: Record<string, unknown>): ExpenseSearch => {
		const page = Number(search.page);
		const category = search.category;
		const from = search.from;
		const to = search.to;
		return {
			page: Number.isFinite(page) && page > 0 ? page : undefined,
			category: EXPENSE_CATEGORIES_SEARCH.includes(
				category as ExpenseCategorySearch,
			)
				? (category as ExpenseCategorySearch)
				: undefined,
			from:
				typeof from === 'string' && ISO_DATE_SEARCH.test(from) ? from : undefined,
			to: typeof to === 'string' && ISO_DATE_SEARCH.test(to) ? to : undefined,
		};
	},
	component: ExpensesRoute,
});

type LeadSourceSearch =
	'INSTAGRAM' | 'TELEGRAM' | 'REFERRAL' | 'WALK_IN' | 'WEBSITE' | 'OTHER';

const LEAD_SOURCE_SEARCH: LeadSourceSearch[] = [
	'INSTAGRAM',
	'TELEGRAM',
	'REFERRAL',
	'WALK_IN',
	'WEBSITE',
	'OTHER',
];

type LeadWindowSearch = '24h' | '7d' | '30d' | '90d';
const LEAD_WINDOW_SEARCH: LeadWindowSearch[] = ['24h', '7d', '30d', '90d'];

interface LeadSearch {
	source?: LeadSourceSearch;
	assignedToStaffId?: number;
	courseInterestId?: number;
	search?: string;
	window?: LeadWindowSearch;
}

const leadsRoute = createRoute({
	getParentRoute: () => authedRoute,
	path: '/leads',
	beforeLoad: () => requirePermission('lead.read'),
	validateSearch: (search: Record<string, unknown>): LeadSearch => {
		const source = search.source;
		const assignedToStaffId = Number(search.assignedToStaffId);
		const courseInterestId = Number(search.courseInterestId);
		const searchTerm = search.search;
		const window = search.window;
		return {
			source: LEAD_SOURCE_SEARCH.includes(source as LeadSourceSearch)
				? (source as LeadSourceSearch)
				: undefined,
			assignedToStaffId:
				Number.isFinite(assignedToStaffId) && assignedToStaffId > 0
					? assignedToStaffId
					: undefined,
			courseInterestId:
				Number.isFinite(courseInterestId) && courseInterestId > 0
					? courseInterestId
					: undefined,
			search:
				typeof searchTerm === 'string' && searchTerm.trim()
					? searchTerm
					: undefined,
			window: LEAD_WINDOW_SEARCH.includes(window as LeadWindowSearch)
				? (window as LeadWindowSearch)
				: undefined,
		};
	},
	component: LeadsRoute,
});

const routeTree = rootRoute.addChildren([
	loginRoute,
	forbiddenRoute,
	subscriptionRoute,
	authedRoute.addChildren([
		dashboardRoute,
		studentsRoute,
		studentDetailRoute,
		staffRoute,
		staffDetailRoute,
		staffEditRoute,
		roomsRoute,
		feePlansRoute,
		billingPolicyRoute,
		discountsRoute,
		invoicesRoute,
		invoiceDetailRoute,
		paymentsRoute,
		branchesRoute,
		notificationsRoute,
		coursesRoute,
		courseDetailRoute,
		groupsRoute,
		groupNewRoute,
		groupDetailRoute,
		groupEditRoute,
		scheduleIndexRoute,
		scheduleWeekRoute,
		scheduleMonthRoute,
		scheduleRoomsRoute,
		payrollRoute,
		payrollDetailRoute,
		expensesRoute,
		leadsRoute,
		accountRoute,
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
