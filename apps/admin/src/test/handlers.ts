import { http, HttpResponse } from 'msw';

/** Mirrors the backend response envelope + admin auth contract for tests. */
const BASE = 'http://localhost:5050/api/v1';

function ok(data: unknown) {
	return HttpResponse.json({ success: true, data, meta: { timestamp: 'test' } });
}

function okPaged(data: unknown[], page: number, limit: number, total: number) {
	return HttpResponse.json({
		success: true,
		data,
		meta: {
			timestamp: 'test',
			page,
			limit,
			total,
			totalPages: Math.max(1, Math.ceil(total / limit)),
		},
	});
}

function fail(status: number, code: string, message: string) {
	return HttpResponse.json(
		{ success: false, error: { code, message }, meta: { timestamp: 'test' } },
		{ status },
	);
}

/** The single valid operator credential set used across tests. */
export const VALID = {
	email: 'operator@cohort.uz',
	password: 'S3cret-pass',
	code: '123456',
};

export const authResult = {
	accessToken: 'access-token-1',
	refreshToken: 'refresh-token-1',
	expiresIn: 900,
	user: {
		id: 1,
		firstName: 'Olim',
		lastName: 'Operator',
		roles: ['SUPER_ADMIN'],
		branchScope: null,
	},
};

export const operatorProfile = {
	id: 1,
	firstName: 'Olim',
	lastName: 'Operator',
	email: VALID.email,
	phone: '+998901234567',
	roles: ['SUPER_ADMIN'],
};

// ─── Plan fixtures ────────────────────────────────────────────────────────────

export const MOCK_PLANS = [
	{
		id: 1,
		name: 'Starter',
		priceMonthly: 1_200_000,
		priceAnnual: 12_000_000,
		maxStudents: 300,
		maxBranches: 1,
		features: {
			billing: true,
			payroll: false,
			assessments: true,
			telegram_bot: false,
			api_access: false,
		},
		isActive: true,
		createdAt: '2025-01-01T00:00:00Z',
		updatedAt: '2025-01-01T00:00:00Z',
	},
	{
		id: 2,
		name: 'Growth',
		priceMonthly: 2_400_000,
		priceAnnual: 24_000_000,
		maxStudents: 1000,
		maxBranches: 5,
		features: {
			billing: true,
			payroll: true,
			assessments: true,
			telegram_bot: true,
			api_access: false,
		},
		isActive: true,
		createdAt: '2025-01-01T00:00:00Z',
		updatedAt: '2025-01-01T00:00:00Z',
	},
	{
		id: 3,
		name: 'Enterprise',
		priceMonthly: 0,
		priceAnnual: 0,
		maxStudents: null,
		maxBranches: null,
		features: {
			billing: true,
			payroll: true,
			assessments: true,
			telegram_bot: true,
			api_access: true,
		},
		isActive: true,
		createdAt: '2025-01-01T00:00:00Z',
		updatedAt: '2025-01-01T00:00:00Z',
	},
];

// ─── Subscription fixtures ────────────────────────────────────────────────────

export const MOCK_SUBSCRIPTIONS = [
	{
		id: 101,
		tenantId: 1,
		tenantName: 'Zabon Academy',
		tenantSubdomain: 'zabon',
		subscriptionTierId: 2,
		tierName: 'Growth',
		status: 'ACTIVE',
		billingInterval: 'MONTHLY',
		unitPrice: 2_400_000,
		monthlyValue: 2_400_000,
		currency: 'UZS',
		currentPeriodStart: '2026-06-01T00:00:00Z',
		currentPeriodEnd: '2026-07-01T00:00:00Z',
		cancelledAt: null,
	},
	{
		id: 102,
		tenantId: 2,
		tenantName: 'Tafakkur School',
		tenantSubdomain: 'tafakkur',
		subscriptionTierId: 1,
		tierName: 'Starter',
		status: 'TRIALING',
		billingInterval: 'MONTHLY',
		unitPrice: 1_200_000,
		monthlyValue: 0,
		currency: 'UZS',
		currentPeriodStart: '2026-06-15T00:00:00Z',
		currentPeriodEnd: '2026-07-15T00:00:00Z',
		cancelledAt: null,
	},
	{
		id: 103,
		tenantId: 3,
		tenantName: "Najot Ta'lim",
		tenantSubdomain: 'najot',
		subscriptionTierId: 2,
		tierName: 'Growth',
		status: 'PAST_DUE',
		billingInterval: 'MONTHLY',
		unitPrice: 2_400_000,
		monthlyValue: 2_400_000,
		currency: 'UZS',
		currentPeriodStart: '2026-05-01T00:00:00Z',
		currentPeriodEnd: '2026-06-01T00:00:00Z',
		cancelledAt: null,
	},
];

export const MOCK_SUBSCRIPTION_ANALYTICS = {
	currency: 'UZS',
	current: {
		mrr: 4_800_000,
		arr: 57_600_000,
		activeCount: 1,
		pastDueCount: 1,
		trialingCount: 1,
		signups: 2,
		churned: 0,
		churnRate: 0,
	},
	trend: [
		{
			periodMonth: '2026-01',
			currency: 'UZS',
			mrr: 2_400_000,
			arr: 28_800_000,
			activeCount: 1,
			pastDueCount: 0,
			trialingCount: 0,
			signups: 1,
			churned: 0,
		},
		{
			periodMonth: '2026-02',
			currency: 'UZS',
			mrr: 2_400_000,
			arr: 28_800_000,
			activeCount: 1,
			pastDueCount: 0,
			trialingCount: 0,
			signups: 0,
			churned: 0,
		},
		{
			periodMonth: '2026-03',
			currency: 'UZS',
			mrr: 2_400_000,
			arr: 28_800_000,
			activeCount: 1,
			pastDueCount: 0,
			trialingCount: 0,
			signups: 0,
			churned: 0,
		},
		{
			periodMonth: '2026-04',
			currency: 'UZS',
			mrr: 3_600_000,
			arr: 43_200_000,
			activeCount: 2,
			pastDueCount: 0,
			trialingCount: 0,
			signups: 1,
			churned: 0,
		},
		{
			periodMonth: '2026-05',
			currency: 'UZS',
			mrr: 4_800_000,
			arr: 57_600_000,
			activeCount: 2,
			pastDueCount: 1,
			trialingCount: 0,
			signups: 0,
			churned: 0,
		},
		{
			periodMonth: '2026-06',
			currency: 'UZS',
			mrr: 4_800_000,
			arr: 57_600_000,
			activeCount: 1,
			pastDueCount: 1,
			trialingCount: 1,
			signups: 2,
			churned: 0,
		},
	],
	reconciliation: {
		collectedThisMonth: 2_400_000,
		note: 'Collected from 1 active subscription',
	},
};

// ─── User fixtures ────────────────────────────────────────────────────────────

export const MOCK_USERS = [
	{
		id: 1,
		firstName: 'Aziz',
		lastName: 'Yusupov',
		phone: '+998901234567',
		email: 'aziz@zabon.uz',
		isActive: true,
		status: 'active',
		lastLoginAt: '2026-06-29T07:00:00Z',
		membershipCount: 1,
		tenants: [
			{ tenantId: 1, name: 'Zabon Academy', subdomain: 'zabon', status: 'ACTIVE' },
		],
	},
	{
		id: 2,
		firstName: 'Dilnoza',
		lastName: 'Karimova',
		phone: '+998909876543',
		email: 'dilnoza@tafakkur.uz',
		isActive: true,
		status: 'active',
		lastLoginAt: '2026-06-28T15:30:00Z',
		membershipCount: 2,
		tenants: [
			{ tenantId: 1, name: 'Zabon Academy', subdomain: 'zabon', status: 'ACTIVE' },
			{
				tenantId: 2,
				name: 'Tafakkur School',
				subdomain: 'tafakkur',
				status: 'ACTIVE',
			},
		],
	},
	{
		id: 3,
		firstName: 'Jasur',
		lastName: 'Rakhimov',
		phone: '+998911234567',
		email: null,
		isActive: false,
		status: 'inactive',
		lastLoginAt: null,
		membershipCount: 1,
		tenants: [
			{
				tenantId: 3,
				name: "Najot Ta'lim",
				subdomain: 'najot',
				status: 'SUSPENDED',
			},
		],
	},
];

export const MOCK_USER_DETAIL = {
	id: 1,
	firstName: 'Aziz',
	lastName: 'Yusupov',
	phone: '+998901234567',
	email: 'aziz@zabon.uz',
	avatarUrl: null,
	isActive: true,
	status: 'active',
	lastLoginAt: '2026-06-29T07:00:00Z',
	createdAt: '2025-03-15T10:00:00Z',
	memberships: [
		{
			tenantId: 1,
			tenant: {
				id: 1,
				name: 'Zabon Academy',
				subdomain: 'zabon',
				status: 'ACTIVE',
			},
			status: 'active',
			joinedAt: '2025-03-15T10:00:00Z',
			roles: ['OWNER'],
		},
	],
};

// ─── Audit log fixtures ───────────────────────────────────────────────────────

export const MOCK_AUDIT_LOGS = [
	{
		id: 1,
		timestamp: '2026-06-29T07:00:00Z',
		actor: { userId: 1, name: 'Olim Operator', role: 'SUPER_ADMIN' },
		tenant: { id: 1, name: 'Zabon Academy', subdomain: 'zabon' },
		action: 'tenant.suspend',
		entityType: 'tenant',
		entityId: 1,
		ipAddress: '10.0.0.1',
		details: { before: { status: 'ACTIVE' }, after: { status: 'SUSPENDED' } },
	},
	{
		id: 2,
		timestamp: '2026-06-28T12:00:00Z',
		actor: { userId: 1, name: 'Olim Operator', role: 'SUPER_ADMIN' },
		tenant: null,
		action: 'plan.create',
		entityType: 'subscription_tier',
		entityId: 3,
		ipAddress: '10.0.0.1',
		details: { before: null, after: { name: 'Enterprise', priceMonthly: 0 } },
	},
	{
		id: 3,
		timestamp: '2026-06-27T09:30:00Z',
		actor: { userId: 1, name: 'Olim Operator', role: 'SUPER_ADMIN' },
		tenant: { id: 2, name: 'Tafakkur School', subdomain: 'tafakkur' },
		action: 'subscription.change_plan',
		entityType: 'subscription',
		entityId: 102,
		ipAddress: '10.0.0.1',
		details: { before: { tierId: 1 }, after: { tierId: 2 } },
	},
];

// ─── Dashboard fixture ────────────────────────────────────────────────────────

export const MOCK_DASHBOARD = {
	currency: 'UZS',
	generatedAt: '2026-06-30T00:00:00Z',
	tenants: {
		total: 3,
		active: 2,
		byStatus: { ACTIVE: 2, SUSPENDED: 1, PENDING: 0, CANCELLED: 0 },
		newThisMonth: 2,
	},
	students: { active: 850 },
	branches: { active: 7 },
	mrr: {
		current: 4_800_000,
		arr: 57_600_000,
		growth: 33.3,
		signups: 2,
		churned: 0,
		churnRate: 0,
		trend: MOCK_SUBSCRIPTION_ANALYTICS.trend,
	},
	revenue: {
		processedTotal: 24_000_000,
		processedThisMonth: 2_400_000,
		currency: 'UZS',
	},
	atRisk: {
		count: 1,
		tenants: [
			{
				tenantId: 3,
				name: "Najot Ta'lim",
				subdomain: 'najot',
				status: 'SUSPENDED',
				reason: 'SUSPENDED',
				reasons: ['SUSPENDED'],
				trialEndsAt: null,
				daysUntilTrialEnd: null,
			},
		],
	},
};

// ─── Tenant fixtures ──────────────────────────────────────────────────────────

export const MOCK_TENANT_LIST = [
	{
		id: 1,
		name: 'Zabon Academy',
		subdomain: 'zabon',
		status: 'ACTIVE',
		plan: { id: 2, name: 'Growth' },
		subscriptionStatus: 'ACTIVE',
		branches: 3,
		students: 640,
		mrr: 2_400_000,
		currency: 'UZS',
	},
	{
		id: 2,
		name: 'Tafakkur School',
		subdomain: 'tafakkur',
		status: 'ACTIVE',
		plan: { id: 1, name: 'Starter' },
		subscriptionStatus: 'TRIALING',
		branches: 1,
		students: 180,
		mrr: 0,
		currency: 'UZS',
	},
	{
		id: 3,
		name: "Najot Ta'lim",
		subdomain: 'najot',
		status: 'SUSPENDED',
		plan: { id: 2, name: 'Growth' },
		subscriptionStatus: 'PAST_DUE',
		branches: 2,
		students: 420,
		mrr: 2_400_000,
		currency: 'UZS',
	},
];

export const MOCK_TENANT_SUMMARY = {
	currency: 'UZS',
	total: 3,
	byStatus: { ACTIVE: 2, SUSPENDED: 1, PENDING: 0, CANCELLED: 0 },
	bySubscription: { TRIALING: 1, ACTIVE: 1, PAST_DUE: 1, CANCELLED: 0 },
	totalMrr: 4_800_000,
};

export const MOCK_TENANT_DETAIL = {
	id: 1,
	name: 'Zabon Academy',
	subdomain: 'zabon',
	status: 'ACTIVE',
	city: 'Tashkent',
	phone: '+998901234567',
	timezone: 'Asia/Tashkent',
	locale: 'uz',
	defaultCurrency: 'UZS',
	brandColor: null,
	subscriptionTierId: 2,
	branch: { id: 1, name: 'Main Campus', code: 'BR-001', isMain: true },
	owner: {
		id: 1,
		phone: '+998901234567',
		email: 'aziz@zabon.uz',
		firstName: 'Aziz',
		lastName: 'Yusupov',
	},
	subscription: {
		id: 101,
		status: 'ACTIVE',
		subscriptionTierId: 2,
		currentPeriodStart: '2026-06-01T00:00:00Z',
		currentPeriodEnd: '2026-07-01T00:00:00Z',
	},
};

export const MOCK_TENANT_BRANCHES = [
	{
		id: 1,
		name: 'Main Campus',
		code: 'BR-001',
		isMain: true,
		isActive: true,
		address: '12 Amir Temur Ave',
		phone: '+998901234567',
		email: 'main@zabon.uz',
		timezone: 'Asia/Tashkent',
	},
	{
		id: 2,
		name: 'Chilanzar Branch',
		code: 'BR-002',
		isMain: false,
		isActive: true,
		address: null,
		phone: null,
		email: null,
		timezone: 'Asia/Tashkent',
	},
	{
		id: 3,
		name: 'Yunusobod Branch',
		code: 'BR-003',
		isMain: false,
		isActive: true,
		address: null,
		phone: null,
		email: null,
		timezone: 'Asia/Tashkent',
	},
];

export const MOCK_TENANT_STATS = {
	activeStudents: 640,
	activeStaff: 28,
	monthlyRevenue: 2_400_000,
	outstandingBalance: 0,
	lastLoginAt: '2026-06-29T07:00:00Z',
	currency: 'UZS',
};

// ─── Roles & permissions fixtures ────────────────────────────────────────────

export const MOCK_ROLES = [
	{
		id: 1,
		name: 'OWNER',
		description: 'Full access to all tenant resources',
		isSystem: true,
		editable: false,
		permissions: [
			'student.view',
			'student.create',
			'student.delete',
			'invoice.create',
			'invoice.void',
			'payroll.approve',
			'attendance.mark',
			'grade.enter',
			'group.manage',
			'settings.edit',
			'role.manage',
			'report.view',
		],
	},
	{
		id: 2,
		name: 'ADMIN',
		description: 'Manage center operations and staff',
		isSystem: true,
		editable: true,
		permissions: [
			'student.view',
			'student.create',
			'student.delete',
			'invoice.create',
			'invoice.void',
			'attendance.mark',
			'group.manage',
			'settings.edit',
			'report.view',
		],
	},
	{
		id: 3,
		name: 'MANAGER',
		description: 'Day-to-day operations',
		isSystem: true,
		editable: true,
		permissions: [
			'student.view',
			'student.create',
			'invoice.create',
			'attendance.mark',
			'group.manage',
			'report.view',
		],
	},
	{
		id: 4,
		name: 'TEACHER',
		description: 'Teaching and grading',
		isSystem: true,
		editable: true,
		permissions: ['student.view', 'attendance.mark', 'grade.enter'],
	},
	{
		id: 5,
		name: 'STUDENT',
		description: 'Student portal access',
		isSystem: true,
		editable: false,
		permissions: [],
	},
	{
		id: 6,
		name: 'PARENT',
		description: 'Parent portal access',
		isSystem: true,
		editable: false,
		permissions: [],
	},
];

export const MOCK_PERMISSIONS = {
	groups: [
		{
			domain: 'Students',
			permissions: [
				{ id: 1, code: 'student.view', description: 'View students' },
				{ id: 2, code: 'student.create', description: 'Create student' },
				{ id: 3, code: 'student.delete', description: 'Delete student' },
			],
		},
		{
			domain: 'Finance',
			permissions: [
				{ id: 4, code: 'invoice.create', description: 'Create invoice' },
				{ id: 5, code: 'invoice.void', description: 'Void invoice' },
				{ id: 6, code: 'payroll.approve', description: 'Approve payroll' },
			],
		},
		{
			domain: 'Academics',
			permissions: [
				{ id: 7, code: 'attendance.mark', description: 'Mark attendance' },
				{ id: 8, code: 'grade.enter', description: 'Enter grades' },
				{ id: 9, code: 'group.manage', description: 'Manage groups' },
			],
		},
		{
			domain: 'Administration',
			permissions: [
				{ id: 10, code: 'settings.edit', description: 'Edit settings' },
				{ id: 11, code: 'role.manage', description: 'Manage roles' },
				{ id: 12, code: 'report.view', description: 'View reports' },
			],
		},
	],
	total: 12,
};

// ─── Main handlers (happy path defaults) ─────────────────────────────────────

export const handlers = [
	http.post(`${BASE}/public/admin/auth/login`, async ({ request }) => {
		const body = (await request.json()) as { email: string; password: string };
		if (body.email === VALID.email && body.password === VALID.password) {
			return ok({ status: 'OTP_SENT' });
		}
		return fail(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
	}),

	http.post(`${BASE}/public/admin/auth/verify-otp`, async ({ request }) => {
		const body = (await request.json()) as { email: string; code: string };
		if (body.email === VALID.email && body.code === VALID.code) {
			return ok(authResult);
		}
		return fail(401, 'INVALID_OTP', 'Invalid or expired code.');
	}),

	http.post(`${BASE}/public/auth/refresh`, async ({ request }) => {
		const body = (await request.json()) as { refreshToken?: string };
		if (body.refreshToken) return ok(authResult);
		return fail(401, 'INVALID_TOKEN', 'Invalid refresh token.');
	}),

	http.get(`${BASE}/admin/me`, ({ request }) => {
		if (request.headers.get('Authorization') === `Bearer ${authResult.accessToken}`) {
			return ok(operatorProfile);
		}
		return fail(401, 'UNAUTHORIZED', 'Unauthorized.');
	}),

	// ── Plans ──────────────────────────────────────────────────────────────────

	http.get(`${BASE}/admin/plans`, () => okPaged(MOCK_PLANS, 1, 20, MOCK_PLANS.length)),

	http.post(`${BASE}/admin/plans`, async ({ request }) => {
		const body = (await request.json()) as Record<string, unknown>;
		return ok({
			...body,
			id: 99,
			createdAt: '2026-06-30T00:00:00Z',
			updatedAt: '2026-06-30T00:00:00Z',
		});
	}),

	http.patch(`${BASE}/admin/plans/:id`, async ({ params, request }) => {
		const plan = MOCK_PLANS.find((p) => p.id === Number(params['id']));
		const body = (await request.json()) as Record<string, unknown>;
		if (!plan) return fail(404, 'NOT_FOUND', 'Plan not found.');
		return ok({ ...plan, ...body, updatedAt: '2026-06-30T00:00:00Z' });
	}),

	// ── Subscriptions ──────────────────────────────────────────────────────────

	http.get(`${BASE}/admin/subscriptions`, () =>
		okPaged(MOCK_SUBSCRIPTIONS, 1, 20, MOCK_SUBSCRIPTIONS.length),
	),

	http.get(`${BASE}/admin/subscriptions/analytics`, () =>
		ok(MOCK_SUBSCRIPTION_ANALYTICS),
	),

	// ── Users ──────────────────────────────────────────────────────────────────

	http.get(`${BASE}/admin/users`, () => okPaged(MOCK_USERS, 1, 20, MOCK_USERS.length)),

	http.get(`${BASE}/admin/users/:id`, ({ params }) => {
		const user = MOCK_USERS.find((u) => u.id === Number(params['id']));
		if (!user) return fail(404, 'NOT_FOUND', 'User not found.');
		if (Number(params['id']) === MOCK_USER_DETAIL.id) return ok(MOCK_USER_DETAIL);
		return ok({
			...user,
			avatarUrl: null,
			createdAt: '2025-01-01T00:00:00Z',
			memberships: [],
		});
	}),

	http.post(`${BASE}/admin/users/:id/deactivate`, ({ params }) => {
		const user = MOCK_USERS.find((u) => u.id === Number(params['id']));
		if (!user) return fail(404, 'NOT_FOUND', 'User not found.');
		return ok({ id: Number(params['id']), isActive: false, status: 'inactive' });
	}),

	http.post(`${BASE}/admin/users/:id/reset-password`, ({ params }) => {
		const user = MOCK_USERS.find((u) => u.id === Number(params['id']));
		if (!user) return fail(404, 'NOT_FOUND', 'User not found.');
		return ok(null);
	}),

	// ── Audit logs ─────────────────────────────────────────────────────────────

	http.get(`${BASE}/admin/audit-logs`, () =>
		okPaged(MOCK_AUDIT_LOGS, 1, 20, MOCK_AUDIT_LOGS.length),
	),

	http.get(`${BASE}/admin/audit-logs/:id`, ({ params }) => {
		const log = MOCK_AUDIT_LOGS.find((l) => l.id === Number(params['id']));
		if (!log) return fail(404, 'NOT_FOUND', 'Audit log not found.');
		return ok(log);
	}),

	// ── Roles & permissions ────────────────────────────────────────────────────

	http.get(`${BASE}/admin/roles`, () => ok(MOCK_ROLES)),

	http.get(`${BASE}/admin/permissions`, () => ok(MOCK_PERMISSIONS)),

	http.patch(`${BASE}/admin/roles/:role/permissions`, async ({ params, request }) => {
		const role = MOCK_ROLES.find((r) => r.name === params['role']);
		if (!role) return fail(404, 'ROLE_NOT_FOUND', 'Role not found.');
		if (!role.editable)
			return fail(400, 'ROLE_NOT_EDITABLE', 'This role cannot be modified.');
		const body = (await request.json()) as { permissionCodes: string[] };
		return ok({ ...role, permissions: body.permissionCodes });
	}),

	// ── Dashboard ──────────────────────────────────────────────────────────────

	http.get(`${BASE}/admin/dashboard`, () => ok(MOCK_DASHBOARD)),

	// ── Tenant queries ─────────────────────────────────────────────────────────

	http.get(`${BASE}/admin/tenants`, ({ request }) => {
		const url = new URL(request.url);
		const status = url.searchParams.get('status');
		const search = url.searchParams.get('search')?.toLowerCase() ?? '';
		const page = Number(url.searchParams.get('page') ?? 1);
		const limit = Number(url.searchParams.get('limit') ?? 20);

		let rows = MOCK_TENANT_LIST;
		if (status) rows = rows.filter((t) => t.status === status);
		if (search)
			rows = rows.filter(
				(t) =>
					t.name.toLowerCase().includes(search) ||
					t.subdomain.toLowerCase().includes(search),
			);

		const total = rows.length;
		const start = (page - 1) * limit;
		return okPaged(rows.slice(start, start + limit), page, limit, total);
	}),

	http.get(`${BASE}/admin/tenants/summary`, () => ok(MOCK_TENANT_SUMMARY)),

	http.get(`${BASE}/admin/tenants/:id`, ({ params }) => {
		const id = Number(params['id']);
		if (id === MOCK_TENANT_DETAIL.id) return ok(MOCK_TENANT_DETAIL);
		const tenant = MOCK_TENANT_LIST.find((t) => t.id === id);
		if (!tenant) return fail(404, 'NOT_FOUND', 'Tenant not found.');
		const sub = MOCK_SUBSCRIPTIONS.find((s) => s.tenantId === id);
		return ok({
			...tenant,
			timezone: 'Asia/Tashkent',
			locale: 'uz',
			defaultCurrency: 'UZS',
			brandColor: null,
			branch: {
				id: id * 10,
				name: 'Main Branch',
				code: `BR-00${id}`,
				isMain: true,
			},
			subscription: sub
				? {
						id: sub.id,
						status: sub.status,
						subscriptionTierId: sub.subscriptionTierId,
						currentPeriodStart: sub.currentPeriodStart,
						currentPeriodEnd: sub.currentPeriodEnd,
					}
				: {
						id: 0,
						status: 'ACTIVE',
						subscriptionTierId: tenant.plan?.id ?? 1,
						currentPeriodStart: '2026-06-01T00:00:00Z',
						currentPeriodEnd: '2026-07-01T00:00:00Z',
					},
		});
	}),

	http.get(`${BASE}/admin/tenants/:id/branches`, ({ params }) => {
		const id = Number(params['id']);
		const tenant = MOCK_TENANT_LIST.find((t) => t.id === id);
		if (!tenant) return fail(404, 'NOT_FOUND', 'Tenant not found.');
		if (id === MOCK_TENANT_DETAIL.id) return ok(MOCK_TENANT_BRANCHES);
		return ok([]);
	}),

	http.get(`${BASE}/admin/tenants/:id/stats`, ({ params }) => {
		const id = Number(params['id']);
		const tenant = MOCK_TENANT_LIST.find((t) => t.id === id);
		if (!tenant) return fail(404, 'NOT_FOUND', 'Tenant not found.');
		return ok({
			...MOCK_TENANT_STATS,
			activeStudents: tenant.students,
			monthlyRevenue: tenant.mrr,
			currency: tenant.currency,
		});
	}),

	http.patch(`${BASE}/admin/tenants/:id`, async ({ params, request }) => {
		const id = Number(params['id']);
		const tenant = MOCK_TENANT_LIST.find((t) => t.id === id);
		if (!tenant) return fail(404, 'NOT_FOUND', 'Tenant not found.');
		const body = (await request.json()) as Record<string, unknown>;
		return ok({ ...MOCK_TENANT_DETAIL, ...body, id });
	}),

	http.post(`${BASE}/admin/tenants/:id/change-plan`, async ({ params, request }) => {
		const id = Number(params['id']);
		const tenant = MOCK_TENANT_LIST.find((t) => t.id === id);
		if (!tenant) return fail(404, 'NOT_FOUND', 'Tenant not found.');
		const body = (await request.json()) as Record<string, unknown>;
		return ok({
			id: 101,
			tenantId: id,
			tenantName: tenant.name,
			tenantSubdomain: tenant.subdomain,
			subscriptionTierId: body['subscriptionTierId'],
			tierName: null,
			status: 'ACTIVE',
			billingInterval: body['billingInterval'] ?? 'MONTHLY',
			unitPrice: 0,
			monthlyValue: 0,
			currency: 'UZS',
			currentPeriodStart: '2026-07-01T00:00:00Z',
			currentPeriodEnd: '2026-08-01T00:00:00Z',
			cancelledAt: null,
		});
	}),

	// ── Tenant mutations ───────────────────────────────────────────────────────

	http.post(`${BASE}/admin/tenants`, async ({ request }) => {
		const body = (await request.json()) as Record<string, unknown>;
		return ok({
			id: 99,
			name: body['name'],
			subdomain: body['subdomain'],
			status: 'ACTIVE',
			subscriptionTierId: body['subscriptionTierId'],
		});
	}),

	// ── Tenant members ─────────────────────────────────────────────────────────

	http.post(`${BASE}/admin/tenants/:id/members`, ({ params }) => {
		const tenant = MOCK_TENANT_LIST.find((t) => t.id === Number(params['id']));
		if (!tenant) return fail(404, 'NOT_FOUND', 'Tenant not found.');
		return ok(null);
	}),

	http.patch(`${BASE}/admin/tenants/:id/members/:userId`, ({ params }) => {
		const tenant = MOCK_TENANT_LIST.find((t) => t.id === Number(params['id']));
		if (!tenant) return fail(404, 'NOT_FOUND', 'Tenant not found.');
		return ok(null);
	}),

	http.post(`${BASE}/admin/tenants/:id/suspend`, ({ params }) =>
		ok({ id: Number(params['id']), status: 'SUSPENDED' }),
	),

	http.post(`${BASE}/admin/tenants/:id/unsuspend`, ({ params }) =>
		ok({ id: Number(params['id']), status: 'ACTIVE' }),
	),

	http.post(`${BASE}/admin/tenants/:id/cancel`, ({ params }) =>
		ok({ id: Number(params['id']), status: 'CANCELLED' }),
	),
];

// ─── Named error handler overrides (use with server.use() in tests) ───────────

export const planHandlers = {
	empty: http.get(`${BASE}/admin/plans`, () => okPaged([], 1, 20, 0)),
	forbidden: http.get(`${BASE}/admin/plans`, () =>
		fail(403, 'FORBIDDEN', 'You do not have permission.'),
	),
	serverError: http.get(`${BASE}/admin/plans`, () =>
		fail(500, 'INTERNAL_ERROR', 'Unexpected server error.'),
	),
};

export const subscriptionHandlers = {
	empty: http.get(`${BASE}/admin/subscriptions`, () => okPaged([], 1, 20, 0)),
	forbidden: http.get(`${BASE}/admin/subscriptions`, () =>
		fail(403, 'FORBIDDEN', 'You do not have permission.'),
	),
	serverError: http.get(`${BASE}/admin/subscriptions`, () =>
		fail(500, 'INTERNAL_ERROR', 'Unexpected server error.'),
	),
};

export const userHandlers = {
	empty: http.get(`${BASE}/admin/users`, () => okPaged([], 1, 20, 0)),
	forbidden: http.get(`${BASE}/admin/users`, () =>
		fail(403, 'FORBIDDEN', 'You do not have permission.'),
	),
	serverError: http.get(`${BASE}/admin/users`, () =>
		fail(500, 'INTERNAL_ERROR', 'Unexpected server error.'),
	),
};

export const auditHandlers = {
	empty: http.get(`${BASE}/admin/audit-logs`, () => okPaged([], 1, 20, 0)),
	forbidden: http.get(`${BASE}/admin/audit-logs`, () =>
		fail(403, 'FORBIDDEN', 'You do not have permission.'),
	),
	serverError: http.get(`${BASE}/admin/audit-logs`, () =>
		fail(500, 'INTERNAL_ERROR', 'Unexpected server error.'),
	),
};

export const tenantHandlers = {
	empty: http.get(`${BASE}/admin/tenants`, () => okPaged([], 1, 20, 0)),
	forbidden: http.get(`${BASE}/admin/tenants`, () =>
		fail(403, 'FORBIDDEN', 'You do not have permission.'),
	),
	serverError: http.get(`${BASE}/admin/tenants`, () =>
		fail(500, 'INTERNAL_ERROR', 'Unexpected server error.'),
	),
};

export const dashboardHandlers = {
	forbidden: http.get(`${BASE}/admin/dashboard`, () =>
		fail(403, 'FORBIDDEN', 'You do not have permission.'),
	),
	serverError: http.get(`${BASE}/admin/dashboard`, () =>
		fail(500, 'INTERNAL_ERROR', 'Unexpected server error.'),
	),
};

export const roleHandlers = {
	empty: http.get(`${BASE}/admin/roles`, () => ok([])),
	forbidden: http.get(`${BASE}/admin/roles`, () =>
		fail(403, 'FORBIDDEN', 'You do not have permission.'),
	),
	serverError: http.get(`${BASE}/admin/roles`, () =>
		fail(500, 'INTERNAL_ERROR', 'Unexpected server error.'),
	),
};
