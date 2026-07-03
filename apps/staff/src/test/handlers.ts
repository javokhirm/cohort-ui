import { http, HttpResponse } from 'msw';

import type { ScheduleDay } from '@/features/groups/api/groups.queries';

/** Mirrors the backend response envelope for the /manage surface in tests. */
const BASE = 'http://localhost:5050/api/v1';
const MANAGE = `${BASE}/manage`;

/** `branchIds` arrives as repeated params (`?branchIds=1&branchIds=2`); `null` = not sent. */
function readBranchIds(url: URL): number[] | null {
	const values = url.searchParams.getAll('branchIds');
	return values.length > 0 ? values.map(Number) : null;
}

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

function fail(
	status: number,
	code: string,
	message: string,
	details?: Record<string, unknown>,
) {
	return HttpResponse.json(
		{
			success: false,
			error: { code, message, ...(details ? { details } : {}) },
			meta: { timestamp: 'test' },
		},
		{ status },
	);
}

// ─── Branch fixtures ──────────────────────────────────────────────────────────

export const MOCK_BRANCHES = [
	{
		id: 1,
		name: 'Main Campus',
		code: 'BR-001',
		address: 'Yunusobod 4-kvartal, Tashkent',
		phone: '+998 71 200 10 10',
		email: null,
		timezone: 'Asia/Tashkent',
		isMain: true,
		isActive: true,
	},
	{
		id: 2,
		name: 'Chilanzar Branch',
		code: 'BR-002',
		address: 'Chilonzor 9-kvartal, Tashkent',
		phone: '+998 71 200 20 20',
		email: null,
		timezone: 'Asia/Tashkent',
		isMain: false,
		isActive: true,
	},
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

// ─── Course fixtures ──────────────────────────────────────────────────────────

interface MockCourse {
	id: number;
	branchId: number | null;
	name: string;
	description: string | null;
	level: string | null;
	defaultDurationWeeks: number | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export const MOCK_COURSES: MockCourse[] = [
	{
		id: 1,
		branchId: null,
		name: 'IELTS Prep',
		description: 'Exam-focused academic English',
		level: 'Upper-Intermediate',
		defaultDurationWeeks: 12,
		isActive: true,
		createdAt: '2025-01-05T00:00:00Z',
		updatedAt: '2025-01-05T00:00:00Z',
	},
	{
		id: 2,
		branchId: 1,
		name: 'General English A2',
		description: null,
		level: 'A2',
		defaultDurationWeeks: 16,
		isActive: true,
		createdAt: '2025-01-06T00:00:00Z',
		updatedAt: '2025-01-06T00:00:00Z',
	},
	{
		id: 3,
		branchId: 2,
		name: 'Kids Coding',
		description: 'Scratch and Python basics',
		level: 'Beginner',
		defaultDurationWeeks: null,
		isActive: false,
		createdAt: '2025-01-07T00:00:00Z',
		updatedAt: '2025-01-07T00:00:00Z',
	},
];

// ─── Group fixtures (subset of GroupListItemResponseDto) ──────────────────────

interface MockGroup {
	id: number;
	name: string;
	branchId: number;
	courseId: number;
	courseName: string;
	defaultTeacherId: number | null;
	defaultTeacherName: string | null;
	roomId: number | null;
	roomName: string | null;
	capacity: number | null;
	status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

export const MOCK_GROUPS: MockGroup[] = [
	{
		id: 10,
		name: 'IELTS Prep — Morning',
		branchId: 1,
		courseId: 1,
		courseName: 'IELTS Prep',
		defaultTeacherId: 101,
		defaultTeacherName: 'Nilufar Saidova',
		roomId: 1,
		roomName: 'Room 204',
		capacity: 15,
		status: 'ACTIVE',
	},
	{
		id: 11,
		name: 'IELTS Prep — Evening',
		branchId: 1,
		courseId: 1,
		courseName: 'IELTS Prep',
		defaultTeacherId: 101,
		defaultTeacherName: 'Nilufar Saidova',
		roomId: 1,
		roomName: 'Room 204',
		capacity: 15,
		status: 'ACTIVE',
	},
	{
		id: 12,
		name: 'IELTS Prep — Weekend (done)',
		branchId: 1,
		courseId: 1,
		courseName: 'IELTS Prep',
		defaultTeacherId: 102,
		defaultTeacherName: 'Jasur Toxtayev',
		roomId: 2,
		roomName: 'Computer Lab',
		capacity: 12,
		status: 'COMPLETED',
	},
];

/** Detail projection for a group (adds counts + schedule + timestamps). */
export function mockGroupDetail(id: number) {
	const group = MOCK_GROUPS.find((g) => g.id === id);
	if (!group) return null;
	return {
		...group,
		startDate: '2025-03-03',
		endDate: '2025-06-30',
		scheduleRule: {
			days: ['MON', 'WED', 'FRI'] as ScheduleDay[],
			startTime: '09:00',
			endTime: '10:30',
		},
		activeEnrollmentsCount: MOCK_ENROLLMENTS.filter(
			(e) => e.groupId === id && e.status === 'ACTIVE',
		).length,
		sessionCount: MOCK_SESSIONS.filter((s) => s.groupId === id).length,
		createdAt: '2025-02-01T00:00:00Z',
		updatedAt: '2025-02-01T00:00:00Z',
	};
}

// ─── Enrollment fixtures ──────────────────────────────────────────────────────

interface MockEnrollment {
	id: number;
	groupId: number;
	studentId: number;
	studentName: string;
	studentCode: string;
	feePlanId: number | null;
	enrolledAt: string;
	status: 'ACTIVE' | 'DROPPED' | 'COMPLETED' | 'TRANSFERRED';
	dropReason: string | null;
	completedAt: string | null;
}

export const MOCK_ENROLLMENTS: MockEnrollment[] = [
	{
		id: 500,
		groupId: 10,
		studentId: 1,
		studentName: 'Aziz Karimov',
		studentCode: 'STU-2024-001',
		feePlanId: null,
		enrolledAt: '2025-03-01T00:00:00Z',
		status: 'ACTIVE',
		dropReason: null,
		completedAt: null,
	},
	{
		id: 501,
		groupId: 10,
		studentId: 2,
		studentName: 'Malika Yusupova',
		studentCode: 'STU-2024-002',
		feePlanId: null,
		enrolledAt: '2025-03-02T00:00:00Z',
		status: 'ACTIVE',
		dropReason: null,
		completedAt: null,
	},
];

// ─── Session fixtures ─────────────────────────────────────────────────────────

interface MockSession {
	id: number;
	branchId: number;
	groupId: number;
	groupName: string;
	courseName: string;
	roomId: number | null;
	roomName: string | null;
	teacherId: number | null;
	teacherName: string | null;
	sessionDate: string;
	startTime: string;
	endTime: string;
	topic: string | null;
	status: 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
}

export const MOCK_SESSIONS: MockSession[] = [
	{
		id: 900,
		branchId: 1,
		groupId: 10,
		groupName: 'IELTS Prep — Morning',
		courseName: 'IELTS Prep',
		roomId: 1,
		roomName: 'Room 204',
		teacherId: 101,
		teacherName: 'Nilufar Saidova',
		sessionDate: '2025-03-03',
		startTime: '09:00',
		endTime: '10:30',
		topic: 'Reading — skimming & scanning',
		status: 'SCHEDULED',
	},
	{
		id: 901,
		branchId: 1,
		groupId: 10,
		groupName: 'IELTS Prep — Morning',
		courseName: 'IELTS Prep',
		roomId: 1,
		roomName: 'Room 204',
		teacherId: 101,
		teacherName: 'Nilufar Saidova',
		sessionDate: '2025-03-05',
		startTime: '09:00',
		endTime: '10:30',
		topic: null,
		status: 'SCHEDULED',
	},
];

export function mockSessionDetail(id: number) {
	const session = MOCK_SESSIONS.find((s) => s.id === id);
	if (!session) return null;
	return {
		...session,
		cancellationReason: null,
		roster: [
			{ studentId: 1, studentName: 'Aziz Karimov', enrollmentStatus: 'ACTIVE' },
			{ studentId: 2, studentName: 'Malika Yusupova', enrollmentStatus: 'ACTIVE' },
		],
		createdAt: '2025-02-01T00:00:00Z',
		updatedAt: '2025-02-01T00:00:00Z',
	};
}

// ─── Student fixtures (for the enroll picker) ─────────────────────────────────

export const MOCK_STUDENTS = [
	{
		id: 1,
		studentCode: 'STU-2024-001',
		branchId: 1,
		status: 'ACTIVE' as const,
		enrolledAt: '2024-09-01T00:00:00Z',
		dateOfBirth: null,
		gender: null,
		user: {
			id: 11,
			firstName: 'Aziz',
			lastName: 'Karimov',
			phone: '+998901112233',
			email: null,
			avatarUrl: null,
		},
	},
	{
		id: 3,
		studentCode: 'STU-2024-003',
		branchId: 1,
		status: 'ACTIVE' as const,
		enrolledAt: '2024-09-01T00:00:00Z',
		dateOfBirth: null,
		gender: null,
		user: {
			id: 13,
			firstName: 'Diyor',
			lastName: 'Rustamov',
			phone: '+998901112255',
			email: null,
			avatarUrl: null,
		},
	},
];

// ─── Fee plan fixtures ────────────────────────────────────────────────────────

export const MOCK_FEE_PLANS = [
	{ id: 1, name: 'IELTS Monthly', amount: 850000, cycle: 'monthly' },
	{ id: 2, name: 'One-time', amount: 2400000, cycle: 'one_time' },
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
	http.get(`${MANAGE}/branches`, ({ request }) => {
		const url = new URL(request.url);
		const isActive = url.searchParams.get('isActive');
		let rows = MOCK_BRANCHES;
		if (isActive !== null)
			rows = rows.filter((b) => b.isActive === (isActive === 'true'));
		return ok(rows);
	}),

	http.post(`${MANAGE}/branches`, async ({ request }) => {
		const body = (await request.json()) as Record<string, unknown>;
		return ok({
			id: 99,
			name: body['name'],
			code: body['code'],
			address: body['address'] ?? null,
			phone: body['phone'] ?? null,
			email: body['email'] ?? null,
			timezone: body['timezone'] ?? null,
			isMain: body['isMain'] ?? false,
			isActive: true,
		});
	}),

	http.patch(`${MANAGE}/branches/:id`, async ({ params, request }) => {
		const branch = MOCK_BRANCHES.find((b) => b.id === Number(params['id']));
		if (!branch) return fail(404, 'BRANCH_NOT_FOUND', 'Branch not found.');
		const body = (await request.json()) as Record<string, unknown>;
		return ok({ ...branch, ...body });
	}),

	// ── Rooms ────────────────────────────────────────────────────────────────
	http.get(`${MANAGE}/rooms`, ({ request }) => {
		const url = new URL(request.url);
		const branchIds = readBranchIds(url);
		const isActive = url.searchParams.get('isActive');
		const page = Number(url.searchParams.get('page') ?? 1);
		const limit = Number(url.searchParams.get('limit') ?? 20);

		let rows = MOCK_ROOMS;
		if (branchIds) rows = rows.filter((r) => branchIds.includes(r.branchId));
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

	// ── Courses ──────────────────────────────────────────────────────────────
	http.get(`${MANAGE}/courses`, ({ request }) => {
		const url = new URL(request.url);
		const branchIds = readBranchIds(url);
		const isActive = url.searchParams.get('isActive');
		const search = url.searchParams.get('search')?.toLowerCase() ?? '';
		const page = Number(url.searchParams.get('page') ?? 1);
		const limit = Number(url.searchParams.get('limit') ?? 20);

		let rows = MOCK_COURSES;
		// Shared courses (null branchId) stay visible under any branch scope.
		if (branchIds)
			rows = rows.filter(
				(c) => c.branchId === null || branchIds.includes(c.branchId),
			);
		if (isActive !== null)
			rows = rows.filter((c) => c.isActive === (isActive === 'true'));
		if (search)
			rows = rows.filter(
				(c) =>
					c.name.toLowerCase().includes(search) ||
					(c.level?.toLowerCase().includes(search) ?? false),
			);

		const total = rows.length;
		const start = (page - 1) * limit;
		return okPaged(rows.slice(start, start + limit), page, limit, total);
	}),

	http.post(`${MANAGE}/courses`, async ({ request }) => {
		const body = (await request.json()) as Record<string, unknown>;
		return ok({
			id: 99,
			branchId: body['branchId'] ?? null,
			name: body['name'],
			description: body['description'] ?? null,
			level: body['level'] ?? null,
			defaultDurationWeeks: body['defaultDurationWeeks'] ?? null,
			isActive: true,
			createdAt: '2026-07-01T00:00:00Z',
			updatedAt: '2026-07-01T00:00:00Z',
		});
	}),

	http.get(`${MANAGE}/courses/:id`, ({ params }) => {
		const course = MOCK_COURSES.find((c) => c.id === Number(params['id']));
		if (!course) return fail(404, 'COURSE_NOT_FOUND', 'Course not found.');
		return ok(course);
	}),

	http.patch(`${MANAGE}/courses/:id`, async ({ params, request }) => {
		const course = MOCK_COURSES.find((c) => c.id === Number(params['id']));
		if (!course) return fail(404, 'COURSE_NOT_FOUND', 'Course not found.');
		const body = (await request.json()) as Record<string, unknown>;
		return ok({ ...course, ...body, updatedAt: '2026-07-02T00:00:00Z' });
	}),

	// ── Groups ───────────────────────────────────────────────────────────────
	http.get(`${MANAGE}/groups`, ({ request }) => {
		const url = new URL(request.url);
		const branchIds = readBranchIds(url);
		const courseId = url.searchParams.get('courseId');
		const status = url.searchParams.get('status');
		const page = Number(url.searchParams.get('page') ?? 1);
		const limit = Number(url.searchParams.get('limit') ?? 20);

		let rows = MOCK_GROUPS;
		if (branchIds) rows = rows.filter((g) => branchIds.includes(g.branchId));
		if (courseId) rows = rows.filter((g) => g.courseId === Number(courseId));
		if (status) rows = rows.filter((g) => g.status === status);

		const total = rows.length;
		const start = (page - 1) * limit;
		return okPaged(rows.slice(start, start + limit), page, limit, total);
	}),

	http.post(`${MANAGE}/groups`, async ({ request }) => {
		const body = (await request.json()) as Record<string, unknown>;
		return ok({
			id: 99,
			branchId: body['branchId'],
			courseId: body['courseId'],
			courseName: 'IELTS Prep',
			defaultTeacherId: body['defaultTeacherId'] ?? null,
			defaultTeacherName: null,
			roomId: body['roomId'] ?? null,
			roomName: null,
			name: body['name'],
			capacity: body['capacity'] ?? null,
			startDate: body['startDate'] ?? null,
			endDate: body['endDate'] ?? null,
			scheduleRule: body['scheduleRule'] ?? null,
			status: 'PLANNED',
			activeEnrollmentsCount: 0,
			sessionCount: 0,
			createdAt: '2026-07-01T00:00:00Z',
			updatedAt: '2026-07-01T00:00:00Z',
		});
	}),

	http.get(`${MANAGE}/groups/:id/enrollments`, ({ params, request }) => {
		const url = new URL(request.url);
		const status = url.searchParams.get('status');
		let rows = MOCK_ENROLLMENTS.filter((e) => e.groupId === Number(params['id']));
		if (status) rows = rows.filter((e) => e.status === status);
		return ok(rows);
	}),

	http.post(`${MANAGE}/groups/:id/enrollments`, async ({ params, request }) => {
		const body = (await request.json()) as { studentIds: number[] };
		const created = body.studentIds.map((studentId, i) => ({
			id: 600 + i,
			groupId: Number(params['id']),
			studentId,
			studentName: 'New Student',
			studentCode: `STU-2024-${String(studentId).padStart(3, '0')}`,
			feePlanId: null,
			enrolledAt: '2026-07-01T00:00:00Z',
			status: 'ACTIVE' as const,
			dropReason: null,
			completedAt: null,
		}));
		return HttpResponse.json(
			{ success: true, data: created, meta: { timestamp: 'test' } },
			{ status: 201 },
		);
	}),

	http.get(`${MANAGE}/groups/:id/sessions`, ({ params }) =>
		ok(MOCK_SESSIONS.filter((s) => s.groupId === Number(params['id']))),
	),

	http.get(`${MANAGE}/groups/:id`, ({ params }) => {
		const detail = mockGroupDetail(Number(params['id']));
		if (!detail) return fail(404, 'GROUP_NOT_FOUND', 'Group not found.');
		return ok(detail);
	}),

	http.patch(`${MANAGE}/groups/:id`, async ({ params, request }) => {
		const detail = mockGroupDetail(Number(params['id']));
		if (!detail) return fail(404, 'GROUP_NOT_FOUND', 'Group not found.');
		const body = (await request.json()) as Record<string, unknown>;
		return ok({ ...detail, ...body, updatedAt: '2026-07-02T00:00:00Z' });
	}),

	// ── Sessions ─────────────────────────────────────────────────────────────
	http.get(`${MANAGE}/sessions`, ({ request }) => {
		const url = new URL(request.url);
		const from = url.searchParams.get('from');
		const to = url.searchParams.get('to');
		const status = url.searchParams.get('status');
		const branchIds = readBranchIds(url);
		let rows = MOCK_SESSIONS;
		if (from) rows = rows.filter((s) => s.sessionDate >= from);
		if (to) rows = rows.filter((s) => s.sessionDate <= to);
		if (status) rows = rows.filter((s) => s.status === status);
		if (branchIds) rows = rows.filter((s) => branchIds.includes(s.branchId));
		return ok(rows);
	}),

	http.get(`${MANAGE}/sessions/:id`, ({ params }) => {
		const detail = mockSessionDetail(Number(params['id']));
		if (!detail) return fail(404, 'SESSION_NOT_FOUND', 'Session not found.');
		return ok(detail);
	}),

	http.patch(`${MANAGE}/sessions/:id`, async ({ params, request }) => {
		const detail = mockSessionDetail(Number(params['id']));
		if (!detail) return fail(404, 'SESSION_NOT_FOUND', 'Session not found.');
		const body = (await request.json()) as Record<string, unknown>;
		return ok({ ...detail, ...body, updatedAt: '2026-07-02T00:00:00Z' });
	}),

	// ── Enrollments ──────────────────────────────────────────────────────────
	http.patch(`${MANAGE}/enrollments/:id`, async ({ params, request }) => {
		const enrollment = MOCK_ENROLLMENTS.find((e) => e.id === Number(params['id']));
		if (!enrollment)
			return fail(404, 'ENROLLMENT_NOT_FOUND', 'Enrollment not found.');
		const body = (await request.json()) as Record<string, unknown>;
		return ok({ ...enrollment, ...body });
	}),

	// ── Students (enroll picker) ──────────────────────────────────────────────
	http.get(`${MANAGE}/students`, ({ request }) => {
		const url = new URL(request.url);
		const branchIds = readBranchIds(url);
		const search = url.searchParams.get('search')?.toLowerCase() ?? '';
		const page = Number(url.searchParams.get('page') ?? 1);
		const limit = Number(url.searchParams.get('limit') ?? 20);
		let rows = MOCK_STUDENTS;
		if (branchIds) rows = rows.filter((s) => branchIds.includes(s.branchId));
		if (search)
			rows = rows.filter(
				(s) =>
					`${s.user.firstName} ${s.user.lastName}`
						.toLowerCase()
						.includes(search) || s.studentCode.toLowerCase().includes(search),
			);
		const total = rows.length;
		const start = (page - 1) * limit;
		return okPaged(rows.slice(start, start + limit), page, limit, total);
	}),

	// ── Fee plans ─────────────────────────────────────────────────────────────
	http.get(`${MANAGE}/fee-plans`, () =>
		okPaged(MOCK_FEE_PLANS, 1, 100, MOCK_FEE_PLANS.length),
	),

	// ── Staff ────────────────────────────────────────────────────────────────
	http.get(`${MANAGE}/staff`, ({ request }) => {
		const url = new URL(request.url);
		const branchIds = readBranchIds(url);
		const role = url.searchParams.get('role');
		const status = url.searchParams.get('status');
		const search = url.searchParams.get('search')?.toLowerCase() ?? '';
		const page = Number(url.searchParams.get('page') ?? 1);
		const limit = Number(url.searchParams.get('limit') ?? 20);

		let rows = MOCK_STAFF;
		if (branchIds) rows = rows.filter((s) => branchIds.includes(s.branchId));
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
		const branchIds = readBranchIds(url);
		const status = url.searchParams.get('status');
		const staffId = url.searchParams.get('staffId');
		const page = Number(url.searchParams.get('page') ?? 1);
		const limit = Number(url.searchParams.get('limit') ?? 20);

		let rows = MOCK_PAYROLLS;
		if (branchIds) rows = rows.filter((p) => branchIds.includes(p.branchId));
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

export const branchHandlers = {
	empty: http.get(`${MANAGE}/branches`, () => ok([])),
	forbidden: http.get(`${MANAGE}/branches`, () =>
		fail(403, 'FORBIDDEN', 'You do not have permission.'),
	),
	serverError: http.get(`${MANAGE}/branches`, () =>
		fail(500, 'INTERNAL_ERROR', 'Unexpected server error.'),
	),
	createConflict: http.post(`${MANAGE}/branches`, () =>
		fail(409, 'BRANCH_CODE_TAKEN', 'Short code is already in use.'),
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

export const courseHandlers = {
	empty: http.get(`${MANAGE}/courses`, () => okPaged([], 1, 20, 0)),
	forbidden: http.get(`${MANAGE}/courses`, () =>
		fail(403, 'FORBIDDEN', 'You do not have permission.'),
	),
	serverError: http.get(`${MANAGE}/courses`, () =>
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

export const groupHandlers = {
	empty: http.get(`${MANAGE}/groups`, () => okPaged([], 1, 20, 0)),
	serverError: http.get(`${MANAGE}/groups`, () =>
		fail(500, 'INTERNAL_ERROR', 'Unexpected server error.'),
	),
	// Group at capacity — POST enroll returns 409.
	enrollFull: http.post(`${MANAGE}/groups/:id/enrollments`, () =>
		fail(409, 'GROUP_AT_CAPACITY', 'Group is at capacity.'),
	),
	// Reschedule/room change collides — PATCH session returns 409.
	sessionConflict: http.patch(`${MANAGE}/sessions/:id`, () =>
		fail(409, 'SESSION_CONFLICT', 'Room 204 is double-booked at this time.'),
	),
	// The requested room is already booked for a scheduled slot — POST group 409.
	createConflict: http.post(`${MANAGE}/groups`, () =>
		fail(
			409,
			'GROUP_SCHEDULE_CONFLICT',
			'The room or teacher is already booked for one or more of the scheduled sessions.',
			{
				conflicts: [
					{
						type: 'ROOM',
						resourceId: 5,
						sessionId: 99,
						groupId: 77,
						sessionDate: '2025-03-03',
						startTime: '09:00:00',
						endTime: '10:30:00',
					},
				],
			},
		),
	),
};
