import { http, HttpResponse } from 'msw';

/** Mirrors the backend response envelope for the /manage surface in tests. */
const BASE = 'http://localhost:5050/api/v1';
const MANAGE = `${BASE}/manage`;

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

// ─── Branch fixtures ──────────────────────────────────────────────────────────

export const MOCK_BRANCHES = [
	{ id: 1, name: 'Main Campus', code: 'BR-001', isMain: true, isActive: true },
	{ id: 2, name: 'Chilanzar Branch', code: 'BR-002', isMain: false, isActive: true },
];

// ─── Room fixtures ────────────────────────────────────────────────────────────

interface MockRoom {
	id: number;
	branchId: number;
	name: string;
	capacity: number;
	type: 'classroom' | 'lab' | 'online' | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export const MOCK_ROOMS: MockRoom[] = [
	{
		id: 1,
		branchId: 1,
		name: 'Room 204',
		capacity: 16,
		type: 'classroom',
		isActive: true,
		createdAt: '2025-01-10T00:00:00Z',
		updatedAt: '2025-01-10T00:00:00Z',
	},
	{
		id: 2,
		branchId: 1,
		name: 'Computer Lab',
		capacity: 24,
		type: 'lab',
		isActive: true,
		createdAt: '2025-01-11T00:00:00Z',
		updatedAt: '2025-01-11T00:00:00Z',
	},
	{
		id: 3,
		branchId: 2,
		name: 'Zoom Room A',
		capacity: 100,
		type: 'online',
		isActive: false,
		createdAt: '2025-01-12T00:00:00Z',
		updatedAt: '2025-01-12T00:00:00Z',
	},
];

// ─── Staff fixtures ───────────────────────────────────────────────────────────

interface MockStaff {
	id: number;
	staffCode: string;
	branchId: number;
	branch: { id: number; name: string } | null;
	position: string | null;
	department: string | null;
	specialization: string[];
	employmentType: 'FULL_TIME' | 'PART_TIME' | 'CONTRACTOR';
	status: 'ACTIVE' | 'ON_LEAVE' | 'TERMINATED';
	hireDate: string | null;
	baseSalary: number | null;
	roles: string[];
	groupsCount: number;
	weeklyHours: number;
	user: {
		id: number;
		firstName: string;
		lastName: string;
		phone: string;
		email: string | null;
		avatarUrl: string | null;
	};
}

export const MOCK_STAFF: MockStaff[] = [
	{
		id: 1,
		staffCode: 'STF-001',
		branchId: 1,
		branch: { id: 1, name: 'Main Campus' },
		position: 'Senior IELTS Teacher',
		department: 'English',
		specialization: ['IELTS', 'General English'],
		employmentType: 'FULL_TIME',
		status: 'ACTIVE',
		hireDate: '2023-09-01',
		baseSalary: 8_000_000,
		roles: ['TEACHER'],
		groupsCount: 3,
		weeklyHours: 18,
		user: {
			id: 101,
			firstName: 'Diyorbek',
			lastName: 'Rustamov',
			phone: '+998901112233',
			email: 'diyor@center.uz',
			avatarUrl: null,
		},
	},
	{
		id: 2,
		staffCode: 'STF-002',
		branchId: 1,
		branch: { id: 1, name: 'Main Campus' },
		position: 'Branch Manager',
		department: 'Operations',
		specialization: [],
		employmentType: 'FULL_TIME',
		status: 'ACTIVE',
		hireDate: '2022-03-15',
		baseSalary: 10_000_000,
		roles: ['MANAGER'],
		groupsCount: 0,
		weeklyHours: 40,
		user: {
			id: 102,
			firstName: 'Nilufar',
			lastName: 'Karimova',
			phone: '+998902223344',
			email: null,
			avatarUrl: null,
		},
	},
	{
		id: 3,
		staffCode: 'STF-003',
		branchId: 2,
		branch: { id: 2, name: 'Chilanzar Branch' },
		position: 'Administrator',
		department: 'Front Desk',
		specialization: [],
		employmentType: 'PART_TIME',
		status: 'ON_LEAVE',
		hireDate: '2024-01-10',
		baseSalary: 5_000_000,
		roles: ['ADMIN'],
		groupsCount: 0,
		weeklyHours: 20,
		user: {
			id: 103,
			firstName: 'Aziz',
			lastName: 'Yusupov',
			phone: '+998903334455',
			email: 'aziz@center.uz',
			avatarUrl: null,
		},
	},
];

// ─── Payroll fixtures ─────────────────────────────────────────────────────────

interface MockPayroll {
	id: number;
	branchId: number;
	staffId: number;
	staff: { id: number; staffCode: string; firstName: string; lastName: string } | null;
	periodStart: string;
	periodEnd: string;
	grossAmount: number;
	deductions: number;
	netAmount: number;
	status: 'DRAFT' | 'APPROVED' | 'PAID';
	breakdown: { hoursTaught?: number; rate?: number; bonuses?: number } | null;
	approvedByUserId: number | null;
	paidAt: string | null;
	createdAt: string;
	updatedAt: string;
}

export const MOCK_PAYROLLS: MockPayroll[] = [
	{
		id: 1,
		branchId: 1,
		staffId: 1,
		staff: {
			id: 1,
			staffCode: 'STF-001',
			firstName: 'Diyorbek',
			lastName: 'Rustamov',
		},
		periodStart: '2026-06-01',
		periodEnd: '2026-06-30',
		grossAmount: 8_000_000,
		deductions: 960_000,
		netAmount: 7_040_000,
		status: 'DRAFT',
		breakdown: { hoursTaught: 72, rate: 100_000, bonuses: 800_000 },
		approvedByUserId: null,
		paidAt: null,
		createdAt: '2026-06-30T00:00:00Z',
		updatedAt: '2026-06-30T00:00:00Z',
	},
	{
		id: 2,
		branchId: 1,
		staffId: 2,
		staff: {
			id: 2,
			staffCode: 'STF-002',
			firstName: 'Nilufar',
			lastName: 'Karimova',
		},
		periodStart: '2026-06-01',
		periodEnd: '2026-06-30',
		grossAmount: 10_000_000,
		deductions: 1_200_000,
		netAmount: 8_800_000,
		status: 'APPROVED',
		breakdown: null,
		approvedByUserId: 1,
		paidAt: null,
		createdAt: '2026-06-30T00:00:00Z',
		updatedAt: '2026-06-30T00:00:00Z',
	},
	{
		id: 3,
		branchId: 2,
		staffId: 3,
		staff: { id: 3, staffCode: 'STF-003', firstName: 'Aziz', lastName: 'Yusupov' },
		periodStart: '2026-05-01',
		periodEnd: '2026-05-31',
		grossAmount: 5_000_000,
		deductions: 600_000,
		netAmount: 4_400_000,
		status: 'PAID',
		breakdown: { hoursTaught: 40 },
		approvedByUserId: 1,
		paidAt: '2026-06-05T00:00:00Z',
		createdAt: '2026-05-31T00:00:00Z',
		updatedAt: '2026-06-05T00:00:00Z',
	},
];

// ─── Handlers (happy-path defaults) ───────────────────────────────────────────

export const handlers = [
	http.post(`${BASE}/public/auth/refresh`, async ({ request }) => {
		const body = (await request.json()) as { refreshToken?: string };
		if (body.refreshToken) {
			return ok({
				accessToken: 'access-token-1',
				refreshToken: 'refresh-token-1',
				expiresIn: 900,
				user: {
					id: 1,
					firstName: 'Olim',
					lastName: 'Owner',
					roles: ['OWNER'],
					branchScope: null,
				},
			});
		}
		return fail(401, 'INVALID_TOKEN', 'Invalid refresh token.');
	}),

	// ── Branches ─────────────────────────────────────────────────────────────
	http.get(`${MANAGE}/branches`, () => ok(MOCK_BRANCHES)),

	// ── Rooms ────────────────────────────────────────────────────────────────
	http.get(`${MANAGE}/rooms`, ({ request }) => {
		const url = new URL(request.url);
		const branchId = url.searchParams.get('branchId');
		const isActive = url.searchParams.get('isActive');
		const page = Number(url.searchParams.get('page') ?? 1);
		const limit = Number(url.searchParams.get('limit') ?? 20);

		let rows = MOCK_ROOMS;
		if (branchId) rows = rows.filter((r) => r.branchId === Number(branchId));
		if (isActive !== null)
			rows = rows.filter((r) => r.isActive === (isActive === 'true'));

		const total = rows.length;
		const start = (page - 1) * limit;
		return okPaged(rows.slice(start, start + limit), page, limit, total);
	}),

	http.post(`${MANAGE}/rooms`, async ({ request }) => {
		const body = (await request.json()) as Record<string, unknown>;
		return ok({
			id: 99,
			branchId: body['branchId'],
			name: body['name'],
			capacity: body['capacity'],
			type: body['type'] ?? null,
			isActive: true,
			createdAt: '2026-07-01T00:00:00Z',
			updatedAt: '2026-07-01T00:00:00Z',
		});
	}),

	http.patch(`${MANAGE}/rooms/:id`, async ({ params, request }) => {
		const room = MOCK_ROOMS.find((r) => r.id === Number(params['id']));
		if (!room) return fail(404, 'ROOM_NOT_FOUND', 'Room not found.');
		const body = (await request.json()) as Record<string, unknown>;
		return ok({ ...room, ...body, updatedAt: '2026-07-02T00:00:00Z' });
	}),

	// ── Staff ────────────────────────────────────────────────────────────────
	http.get(`${MANAGE}/staff`, ({ request }) => {
		const url = new URL(request.url);
		const role = url.searchParams.get('role');
		const status = url.searchParams.get('status');
		const search = url.searchParams.get('search')?.toLowerCase() ?? '';
		const page = Number(url.searchParams.get('page') ?? 1);
		const limit = Number(url.searchParams.get('limit') ?? 20);

		let rows = MOCK_STAFF;
		if (role) rows = rows.filter((s) => s.roles.includes(role));
		if (status) rows = rows.filter((s) => s.status === status);
		if (search)
			rows = rows.filter(
				(s) =>
					`${s.user.firstName} ${s.user.lastName}`
						.toLowerCase()
						.includes(search) || s.staffCode.toLowerCase().includes(search),
			);

		const total = rows.length;
		const start = (page - 1) * limit;
		return okPaged(rows.slice(start, start + limit), page, limit, total);
	}),

	http.post(`${MANAGE}/staff`, async ({ request }) => {
		const body = (await request.json()) as Record<string, unknown>;
		return ok({
			id: 99,
			staffCode: 'STF-099',
			branchId: body['branchId'],
			branch: MOCK_BRANCHES.find((b) => b.id === body['branchId']) ?? null,
			position: body['position'] ?? null,
			department: body['department'] ?? null,
			specialization: body['specialization'] ?? [],
			employmentType: body['employmentType'] ?? 'FULL_TIME',
			status: 'ACTIVE',
			hireDate: body['hireDate'] ?? null,
			baseSalary: body['baseSalary'] ?? null,
			roles: body['roleName'] ? [body['roleName']] : [],
			groupsCount: 0,
			weeklyHours: 0,
			user: {
				id: 199,
				firstName: body['firstName'],
				lastName: body['lastName'],
				phone: body['phone'],
				email: body['email'] ?? null,
				avatarUrl: null,
			},
		});
	}),

	http.get(`${MANAGE}/staff/:id`, ({ params }) => {
		const staff = MOCK_STAFF.find((s) => s.id === Number(params['id']));
		if (!staff) return fail(404, 'NOT_FOUND', 'Staff not found.');
		return ok(staff);
	}),

	http.patch(`${MANAGE}/staff/:id`, async ({ params, request }) => {
		const staff = MOCK_STAFF.find((s) => s.id === Number(params['id']));
		if (!staff) return fail(404, 'NOT_FOUND', 'Staff not found.');
		const body = (await request.json()) as Record<string, unknown>;
		return ok({ ...staff, ...body });
	}),

	http.delete(`${MANAGE}/staff/:id`, ({ params }) => {
		const staff = MOCK_STAFF.find((s) => s.id === Number(params['id']));
		if (!staff) return fail(404, 'NOT_FOUND', 'Staff not found.');
		return new HttpResponse(null, { status: 204 });
	}),

	// ── Payroll ──────────────────────────────────────────────────────────────
	http.get(`${MANAGE}/payrolls`, ({ request }) => {
		const url = new URL(request.url);
		const status = url.searchParams.get('status');
		const staffId = url.searchParams.get('staffId');
		const page = Number(url.searchParams.get('page') ?? 1);
		const limit = Number(url.searchParams.get('limit') ?? 20);

		let rows = MOCK_PAYROLLS;
		if (status) rows = rows.filter((p) => p.status === status);
		if (staffId) rows = rows.filter((p) => p.staffId === Number(staffId));

		const total = rows.length;
		const start = (page - 1) * limit;
		return okPaged(rows.slice(start, start + limit), page, limit, total);
	}),

	http.post(`${MANAGE}/payrolls/run`, async ({ request }) => {
		const body = (await request.json()) as {
			periodStart: string;
			periodEnd: string;
		};
		const payrolls = MOCK_PAYROLLS.map((p) => ({
			...p,
			status: 'DRAFT' as const,
			periodStart: body.periodStart,
			periodEnd: body.periodEnd,
		}));
		return ok({ created: payrolls.length, payrolls });
	}),

	http.post(`${MANAGE}/payrolls`, async ({ request }) => {
		const body = (await request.json()) as Record<string, unknown>;
		return ok({
			...MOCK_PAYROLLS[0],
			id: 88,
			...body,
			status: 'DRAFT',
		});
	}),

	http.get(`${MANAGE}/payrolls/:id`, ({ params }) => {
		const payroll = MOCK_PAYROLLS.find((p) => p.id === Number(params['id']));
		if (!payroll) return fail(404, 'NOT_FOUND', 'Payroll not found.');
		return ok(payroll);
	}),

	http.patch(`${MANAGE}/payrolls/:id`, async ({ params, request }) => {
		const payroll = MOCK_PAYROLLS.find((p) => p.id === Number(params['id']));
		if (!payroll) return fail(404, 'NOT_FOUND', 'Payroll not found.');
		const body = (await request.json()) as Record<string, unknown>;
		return ok({ ...payroll, ...body });
	}),

	http.post(`${MANAGE}/payrolls/:id/approve`, ({ params }) => {
		const payroll = MOCK_PAYROLLS.find((p) => p.id === Number(params['id']));
		if (!payroll) return fail(404, 'NOT_FOUND', 'Payroll not found.');
		return ok({ ...payroll, status: 'APPROVED', approvedByUserId: 1 });
	}),

	http.post(`${MANAGE}/payrolls/:id/mark-paid`, ({ params }) => {
		const payroll = MOCK_PAYROLLS.find((p) => p.id === Number(params['id']));
		if (!payroll) return fail(404, 'NOT_FOUND', 'Payroll not found.');
		return ok({
			...payroll,
			status: 'PAID',
			paidAt: '2026-07-01T00:00:00Z',
		});
	}),
];

// ─── Named error/empty overrides (use with server.use() in tests) ─────────────

export const staffHandlers = {
	empty: http.get(`${MANAGE}/staff`, () => okPaged([], 1, 20, 0)),
	forbidden: http.get(`${MANAGE}/staff`, () =>
		fail(403, 'FORBIDDEN', 'You do not have permission.'),
	),
	serverError: http.get(`${MANAGE}/staff`, () =>
		fail(500, 'INTERNAL_ERROR', 'Unexpected server error.'),
	),
};

export const roomHandlers = {
	empty: http.get(`${MANAGE}/rooms`, () => okPaged([], 1, 20, 0)),
	forbidden: http.get(`${MANAGE}/rooms`, () =>
		fail(403, 'FORBIDDEN', 'You do not have permission.'),
	),
	serverError: http.get(`${MANAGE}/rooms`, () =>
		fail(500, 'INTERNAL_ERROR', 'Unexpected server error.'),
	),
};

export const payrollHandlers = {
	empty: http.get(`${MANAGE}/payrolls`, () => okPaged([], 1, 20, 0)),
	forbidden: http.get(`${MANAGE}/payrolls`, () =>
		fail(403, 'FORBIDDEN', 'You do not have permission.'),
	),
	approveForbidden: http.post(`${MANAGE}/payrolls/:id/approve`, () =>
		fail(403, 'FORBIDDEN', 'You do not have permission.'),
	),
};
