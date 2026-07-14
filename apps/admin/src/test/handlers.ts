import { http, HttpResponse } from 'msw';

import { PERMISSION_CODES } from '@/lib/auth/permissions';
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
	/** Required: the plan every group of this course bills on. */
	feePlanId: number;
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
		// Shared course → shared plan (MOCK_FEE_PLANS[0], branchId null).
		feePlanId: 1,
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
		// Branch-1 course → branch-1 plan.
		feePlanId: 2,
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
		// Branch-2 course → shared plan (a shared plan backs any branch).
		feePlanId: 1,
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
	status: 'ACTIVE' | 'SUSPENDED' | 'DROPPED' | 'COMPLETED' | 'TRANSFERRED';
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
		enrolledAt: '2025-03-01',
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
		enrolledAt: '2025-03-02',
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
		enrolledAt: '2024-09-01',
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
		enrolledAt: '2024-09-01',
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

/**
 * A plan says only WHAT to charge. Due day and proration come from the tenant
 * billing policy (§3.12a) and are not per-plan fields — the columns were dropped.
 */
interface MockFeePlan {
	id: number;
	branchId: number | null;
	/** Live groups reaching this plan through their course (list endpoint only). */
	groupCount: number;
	name: string;
	amount: number;
	currency: string;
	billingCycle: 'MONTHLY' | 'PER_SESSION';
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export const MOCK_FEE_PLANS: MockFeePlan[] = [
	{
		id: 1,
		branchId: null,
		groupCount: 2,
		name: 'Monthly Tuition — IELTS',
		amount: 1_300_000,
		currency: 'UZS',
		billingCycle: 'MONTHLY',
		isActive: true,
		createdAt: '2025-01-10T00:00:00Z',
		updatedAt: '2025-01-10T00:00:00Z',
	},
	{
		id: 2,
		branchId: 1,
		groupCount: 1,
		name: 'Monthly Tuition — General English',
		amount: 650_000,
		currency: 'UZS',
		billingCycle: 'MONTHLY',
		isActive: true,
		createdAt: '2025-01-11T00:00:00Z',
		updatedAt: '2025-01-11T00:00:00Z',
	},
	{
		id: 3,
		branchId: null,
		groupCount: 0,
		name: 'Trial Lesson',
		amount: 50_000,
		currency: 'UZS',
		billingCycle: 'PER_SESSION',
		isActive: true,
		createdAt: '2025-01-12T00:00:00Z',
		updatedAt: '2025-01-12T00:00:00Z',
	},
	{
		id: 4,
		branchId: null,
		groupCount: 0,
		name: 'Private Tutoring — Per session',
		amount: 120_000,
		currency: 'UZS',
		billingCycle: 'PER_SESSION',
		isActive: false,
		createdAt: '2025-01-13T00:00:00Z',
		updatedAt: '2025-01-13T00:00:00Z',
	},
];

// ─── Billing policy fixture ───────────────────────────────────────────────────

/** One policy per tenant (`GET /manage/billing-policy` — read-only here). */
export const MOCK_BILLING_POLICY = {
	billingMode: 'PREPAID' as const,
	billingCycleAnchor: 'CALENDAR' as const,
	billingDay: 1,
	dueDay: 5,
	dueOffsetDays: 0,
	immediateDueDays: 3,
	graceDays: 7,
	prorationMethod: 'SESSION' as const,
	consumptionRule: 'ATTENDED_PLUS_UNEXCUSED' as const,
	chargeOnEnrollment: true,
	autoApplyCredit: false,
	remindersEnabled: false,
	lateFeeEnabled: false,
	lateFeeType: 'FIXED' as const,
	lateFeeAmount: 0,
	lateFeeRecurrence: 'ONE_TIME' as const,
	lateFeeMaxTotal: null as number | null,
	autoSuspendAfterDays: null as number | null,
	autoCancelAfterDays: null as number | null,
};

// ─── Payment fixtures ─────────────────────────────────────────────────────────

interface MockPayment {
	id: number;
	branchId: number;
	invoiceId: number | null;
	studentId: number;
	studentName: string;
	amount: number;
	currency: string;
	method: 'CASH' | 'CLICK' | 'PAYME' | 'UZUM' | 'CARD' | 'BANK_TRANSFER';
	status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
	providerTxnId: string | null;
	paidAt: string | null;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
}

export const MOCK_PAYMENTS: MockPayment[] = [
	{
		id: 310,
		branchId: 1,
		invoiceId: 101,
		studentId: 1,
		studentName: 'Aziz Karimov',
		amount: 600_000,
		currency: 'UZS',
		method: 'PAYME',
		status: 'SUCCEEDED',
		providerTxnId: 'PM-TXN-310',
		paidAt: '2026-06-24T09:42:00Z',
		notes: null,
		createdAt: '2026-06-24T09:42:00Z',
		updatedAt: '2026-06-24T09:42:00Z',
	},
	{
		id: 307,
		branchId: 1,
		invoiceId: 102,
		studentId: 3,
		studentName: 'Diyorbek Rustamov',
		amount: 600_000,
		currency: 'UZS',
		method: 'UZUM',
		status: 'SUCCEEDED',
		providerTxnId: 'UZ-TXN-307',
		paidAt: '2026-06-23T16:20:00Z',
		notes: null,
		createdAt: '2026-06-23T16:20:00Z',
		updatedAt: '2026-06-23T16:20:00Z',
	},
	{
		id: 305,
		branchId: 1,
		invoiceId: 103,
		studentId: 1,
		studentName: 'Aziz Karimov',
		amount: 600_000,
		currency: 'UZS',
		method: 'BANK_TRANSFER',
		status: 'PENDING',
		providerTxnId: null,
		paidAt: null,
		notes: null,
		createdAt: '2026-06-23T11:30:00Z',
		updatedAt: '2026-06-23T11:30:00Z',
	},
	{
		id: 304,
		branchId: 2,
		invoiceId: 104,
		studentId: 3,
		studentName: 'Diyorbek Rustamov',
		amount: 1_200_000,
		currency: 'UZS',
		method: 'PAYME',
		status: 'FAILED',
		providerTxnId: 'PM-TXN-304',
		paidAt: '2026-06-22T18:44:00Z',
		notes: null,
		createdAt: '2026-06-22T18:44:00Z',
		updatedAt: '2026-06-22T18:44:00Z',
	},
];

/** Detail projection for a payment (adds the settled invoice's number). */
export function mockPaymentDetail(id: number) {
	const payment = MOCK_PAYMENTS.find((p) => p.id === id);
	if (!payment) return null;
	return {
		...payment,
		invoiceNumber:
			payment.invoiceId != null
				? `INV-2026-${String(payment.invoiceId).padStart(4, '0')}`
				: null,
	};
}

// ─── Wallet fixtures ──────────────────────────────────────────────────────────

type MockWalletTransactionType =
	| 'DEPOSIT'
	| 'OVERPAYMENT'
	| 'REFUND_CREDIT'
	| 'INVOICE_APPLICATION'
	| 'ADJUSTMENT'
	| 'CASHOUT';

interface MockWalletTransaction {
	id: number;
	type: MockWalletTransactionType;
	amount: number;
	invoiceId: number | null;
	paymentId: number | null;
	creditNoteId: number | null;
	notes: string | null;
	createdAt: string;
}

interface MockWallet {
	studentId: number;
	currency: string;
	balance: number;
	transactions: MockWalletTransaction[];
}

/** Mutable per-test-run wallet store, seeded for student 1; other ids start empty. */
const MOCK_WALLETS = new Map<number, MockWallet>([
	[
		1,
		{
			studentId: 1,
			currency: 'UZS',
			balance: 250_000,
			transactions: [
				{
					id: 2,
					type: 'INVOICE_APPLICATION',
					amount: -50_000,
					invoiceId: 101,
					paymentId: null,
					creditNoteId: null,
					notes: null,
					createdAt: '2026-06-25T09:00:00Z',
				},
				{
					id: 1,
					type: 'DEPOSIT',
					amount: 300_000,
					invoiceId: null,
					paymentId: null,
					creditNoteId: null,
					notes: 'Front-desk top-up',
					createdAt: '2026-06-20T10:00:00Z',
				},
			],
		},
	],
]);

function getOrCreateMockWallet(studentId: number): MockWallet {
	let wallet = MOCK_WALLETS.get(studentId);
	if (!wallet) {
		wallet = { studentId, currency: 'UZS', balance: 0, transactions: [] };
		MOCK_WALLETS.set(studentId, wallet);
	}
	return wallet;
}

function pushMockWalletTransaction(
	wallet: MockWallet,
	entry: Omit<MockWalletTransaction, 'id' | 'createdAt'>,
) {
	wallet.transactions = [
		{
			...entry,
			id: wallet.transactions.length + 1,
			createdAt: '2026-07-06T12:00:00Z',
		},
		...wallet.transactions,
	];
}

// ─── Invoice detail fixture (for apply-credit's embedded invoice) ─────────────
// No `GET /invoices/:id` handler exists yet in this file, so this is a small,
// self-contained fixture rather than a full invoice-detail mock system.

const MOCK_INVOICE_DETAIL = {
	id: 101,
	branchId: 1,
	invoiceNumber: 'INV-2026-0101',
	studentId: 1,
	studentName: 'Aziz Karimov',
	studentCode: 'STU-2024-001',
	enrollmentId: null,
	feePlanId: 1,
	periodStart: '2026-06-01',
	periodEnd: '2026-06-30',
	issueDate: '2026-06-01',
	dueDate: '2026-06-05',
	status: 'PARTIAL' as const,
	subtotal: 1_300_000,
	discountAmount: 0,
	taxAmount: 0,
	total: 1_300_000,
	amountPaid: 600_000,
	amountDue: 700_000,
	currency: 'UZS',
	notes: null,
	createdAt: '2026-06-01T00:00:00Z',
	updatedAt: '2026-06-24T09:42:00Z',
	lineItems: [
		{
			id: 1,
			description: 'Monthly Tuition — IELTS',
			quantity: 1,
			unitAmount: 1_300_000,
			amount: 1_300_000,
			type: 'TUITION' as const,
		},
	],
	discounts: [] as {
		id: number;
		discountId: number;
		name: string;
		appliedAmount: number;
	}[],
	payments: [
		{
			id: 310,
			amount: 600_000,
			method: 'PAYME' as const,
			status: 'SUCCEEDED' as const,
			paidAt: '2026-06-24T09:42:00Z',
			providerTxnId: 'PM-TXN-310',
		},
	],
};

// ─── Credit note fixtures ─────────────────────────────────────────────────────

interface MockCreditNote {
	id: number;
	creditNoteNumber: string;
	invoiceId: number;
	studentId: number;
	amount: number;
	reason: string;
	createdByUserId: number;
	createdAt: string;
}

const MOCK_CREDIT_NOTES = new Map<number, MockCreditNote[]>();

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

// ─── Lead fixtures ────────────────────────────────────────────────────────────

const LEAD_STATUS_ORDER = [
	'NEW',
	'CONTACTED',
	'TRIAL_BOOKED',
	'ENROLLED',
	'LOST',
] as const;

interface MockLeadActivity {
	id: number;
	type: string;
	notes: string | null;
	scheduledAt: string | null;
	actorStaffId: number | null;
	actorName: string | null;
	createdAt: string;
}

interface MockLead {
	id: number;
	firstName: string;
	lastName: string | null;
	phoneNumber: string;
	source: string;
	status: string;
	branchId: number;
	courseInterest: { id: number; name: string } | null;
	assignedTo: { id: number; name: string } | null;
	email: string | null;
	notes: string | null;
	convertedStudentId: number | null;
	activities: MockLeadActivity[];
	createdAt: string;
}

const IELTS = { id: 1, name: 'IELTS Prep' };
const GENERAL = { id: 2, name: 'General English (A2)' };
const DILNOZA = { id: 1, name: 'Dilnoza Tosheva' };

export const MOCK_LEADS: MockLead[] = [
	{
		id: 1,
		firstName: 'Bobur',
		lastName: 'Aliyev',
		phoneNumber: '+998912345678',
		source: 'TELEGRAM',
		status: 'NEW',
		branchId: 1,
		courseInterest: GENERAL,
		assignedTo: DILNOZA,
		email: null,
		notes: null,
		convertedStudentId: null,
		activities: [
			{
				id: 11,
				type: 'STATUS_CHANGE',
				notes: 'Lead captured',
				scheduledAt: null,
				actorStaffId: null,
				actorName: null,
				createdAt: '2026-07-04T09:00:00Z',
			},
		],
		createdAt: '2026-07-04T09:00:00Z',
	},
	{
		id: 2,
		firstName: 'Kamola',
		lastName: 'Yodgorova',
		phoneNumber: '+998909012345',
		source: 'WEBSITE',
		status: 'NEW',
		branchId: 2,
		courseInterest: GENERAL,
		assignedTo: null,
		email: null,
		notes: null,
		convertedStudentId: null,
		activities: [],
		createdAt: '2026-07-04T08:00:00Z',
	},
	{
		id: 3,
		firstName: 'Zarina',
		lastName: 'Komilova',
		phoneNumber: '+998905678901',
		source: 'WEBSITE',
		status: 'CONTACTED',
		branchId: 1,
		courseInterest: IELTS,
		assignedTo: DILNOZA,
		email: 'zarina@example.com',
		notes: null,
		convertedStudentId: null,
		activities: [
			{
				id: 31,
				type: 'MESSAGE',
				notes: 'Sent IELTS course brochure and pricing via Telegram',
				scheduledAt: null,
				actorStaffId: 1,
				actorName: 'Dilnoza Tosheva',
				createdAt: '2026-07-02T10:00:00Z',
			},
			{
				id: 32,
				type: 'STATUS_CHANGE',
				notes: 'Submitted the website inquiry form',
				scheduledAt: null,
				actorStaffId: null,
				actorName: null,
				createdAt: '2026-06-30T10:00:00Z',
			},
		],
		createdAt: '2026-06-30T10:00:00Z',
	},
	{
		id: 4,
		firstName: 'Sevara',
		lastName: 'Mirzayeva',
		phoneNumber: '+998901234567',
		source: 'INSTAGRAM',
		status: 'TRIAL_BOOKED',
		branchId: 2,
		courseInterest: IELTS,
		assignedTo: DILNOZA,
		email: null,
		notes: null,
		convertedStudentId: null,
		activities: [],
		createdAt: '2026-07-02T12:00:00Z',
	},
	{
		id: 5,
		firstName: 'Dilshoda',
		lastName: 'Nazarova',
		phoneNumber: '+998937890123',
		source: 'REFERRAL',
		status: 'TRIAL_BOOKED',
		branchId: 1,
		courseInterest: IELTS,
		assignedTo: null,
		email: null,
		notes: null,
		convertedStudentId: null,
		activities: [],
		createdAt: '2026-07-04T03:00:00Z',
	},
	{
		id: 6,
		firstName: 'Jasur',
		lastName: 'Karimov',
		phoneNumber: '+998933456789',
		source: 'WALK_IN',
		status: 'ENROLLED',
		branchId: 1,
		courseInterest: GENERAL,
		assignedTo: DILNOZA,
		email: null,
		notes: null,
		convertedStudentId: 100,
		activities: [],
		createdAt: '2026-06-20T12:00:00Z',
	},
	{
		id: 7,
		firstName: 'Nigora',
		lastName: 'Saidova',
		phoneNumber: '+998944567890',
		source: 'OTHER',
		status: 'LOST',
		branchId: 2,
		courseInterest: null,
		assignedTo: null,
		email: null,
		notes: null,
		convertedStudentId: null,
		activities: [],
		createdAt: '2026-06-15T12:00:00Z',
	},
];

function leadCard(lead: MockLead) {
	const [latest] = lead.activities;
	return {
		id: lead.id,
		firstName: lead.firstName,
		lastName: lead.lastName,
		phoneNumber: lead.phoneNumber,
		source: lead.source,
		status: lead.status,
		branchId: lead.branchId,
		courseInterest: lead.courseInterest,
		assignedTo: lead.assignedTo,
		latestActivity: latest
			? { type: latest.type, notes: latest.notes, createdAt: latest.createdAt }
			: null,
		createdAt: lead.createdAt,
	};
}

function leadDetail(lead: MockLead) {
	return {
		...leadCard(lead),
		email: lead.email,
		notes: lead.notes,
		convertedStudentId: lead.convertedStudentId,
		activities: lead.activities,
	};
}

function filterLeads(url: URL): MockLead[] {
	const branchIds = readBranchIds(url);
	const source = url.searchParams.get('source');
	const assignedToStaffId = url.searchParams.get('assignedToStaffId');
	const courseInterestId = url.searchParams.get('courseInterestId');
	const search = url.searchParams.get('search')?.toLowerCase() ?? '';
	const createdAfter = url.searchParams.get('createdAfter');

	let rows = MOCK_LEADS;
	if (branchIds) rows = rows.filter((l) => branchIds.includes(l.branchId));
	if (source) rows = rows.filter((l) => l.source === source);
	if (assignedToStaffId)
		rows = rows.filter((l) => l.assignedTo?.id === Number(assignedToStaffId));
	if (courseInterestId)
		rows = rows.filter((l) => l.courseInterest?.id === Number(courseInterestId));
	if (search)
		rows = rows.filter(
			(l) =>
				`${l.firstName} ${l.lastName ?? ''}`.toLowerCase().includes(search) ||
				l.phoneNumber.includes(search),
		);
	if (createdAfter) rows = rows.filter((l) => l.createdAt >= createdAfter);
	return rows;
}

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

	// ── Profile (resolved permissions) ─────────────────────────────────────────
	http.get(`${MANAGE}/me`, () =>
		ok({
			id: 1,
			firstName: 'Olim',
			lastName: 'Owner',
			email: null,
			phone: '+998901112200',
			avatarUrl: null,
			roles: ['OWNER'],
			branchScope: null,
			// OWNER holds the full catalog on the backend.
			permissions: [...PERMISSION_CODES],
		}),
	),

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
			feePlanId: body['feePlanId'],
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
		const body = (await request.json()) as {
			studentIds: number[];
			enrolledAt?: string;
		};
		const created = body.studentIds.map((studentId, i) => ({
			id: 600 + i,
			groupId: Number(params['id']),
			studentId,
			studentName: 'New Student',
			studentCode: `STU-2024-${String(studentId).padStart(3, '0')}`,
			feePlanId: null,
			// The billing anniversary anchor: echo back what the client sent, and
			// otherwise default it the way the server does (today, center timezone).
			enrolledAt: body.enrolledAt ?? '2026-07-01',
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

	// ── Wallet ───────────────────────────────────────────────────────────────
	http.get(`${MANAGE}/students/:id/wallet`, ({ params }) =>
		ok(getOrCreateMockWallet(Number(params['id']))),
	),

	http.post(`${MANAGE}/students/:id/wallet/deposits`, async ({ params, request }) => {
		const wallet = getOrCreateMockWallet(Number(params['id']));
		const body = (await request.json()) as {
			amount: number;
			method: string;
			notes?: string | null;
		};
		if (!['CASH', 'CARD', 'BANK_TRANSFER'].includes(body.method)) {
			return fail(
				422,
				'PAYMENT_METHOD_NOT_MANUAL',
				'This method cannot be used for a manual deposit.',
			);
		}
		wallet.balance += body.amount;
		pushMockWalletTransaction(wallet, {
			type: 'DEPOSIT',
			amount: body.amount,
			invoiceId: null,
			paymentId: null,
			creditNoteId: null,
			notes: body.notes ?? null,
		});
		return ok(wallet);
	}),

	http.post(
		`${MANAGE}/students/:id/wallet/adjustments`,
		async ({ params, request }) => {
			const wallet = getOrCreateMockWallet(Number(params['id']));
			const body = (await request.json()) as { amount: number; reason: string };
			if (body.amount === 0) {
				return fail(422, 'WALLET_ADJUSTMENT_INVALID', 'Amount must not be zero.');
			}
			if (wallet.balance + body.amount < 0) {
				return fail(
					422,
					'CREDIT_INSUFFICIENT_BALANCE',
					'This adjustment would drive the balance below zero.',
				);
			}
			wallet.balance += body.amount;
			pushMockWalletTransaction(wallet, {
				type: 'ADJUSTMENT',
				amount: body.amount,
				invoiceId: null,
				paymentId: null,
				creditNoteId: null,
				notes: body.reason,
			});
			return ok(wallet);
		},
	),

	// ── Fee plans ─────────────────────────────────────────────────────────────
	http.get(`${MANAGE}/fee-plans`, ({ request }) => {
		const url = new URL(request.url);
		const branchIds = readBranchIds(url);
		const isActive = url.searchParams.get('isActive');
		const page = Number(url.searchParams.get('page') ?? 1);
		const limit = Number(url.searchParams.get('limit') ?? 20);

		let rows = MOCK_FEE_PLANS;
		// Shared plans (null branchId) stay visible under any branch scope.
		if (branchIds)
			rows = rows.filter(
				(p) => p.branchId === null || branchIds.includes(p.branchId),
			);
		if (isActive !== null)
			rows = rows.filter((p) => p.isActive === (isActive === 'true'));

		const total = rows.length;
		const start = (page - 1) * limit;
		return okPaged(rows.slice(start, start + limit), page, limit, total);
	}),

	/** Groups whose course bills on the plan; read-only drill-in from the plans page. */
	http.get(`${MANAGE}/fee-plans/:id/groups`, ({ params }) => {
		const feePlan = MOCK_FEE_PLANS.find((p) => p.id === Number(params['id']));
		if (!feePlan) return fail(404, 'FEE_PLAN_NOT_FOUND', 'Fee plan not found.');
		const rows = MOCK_GROUPS.slice(0, feePlan.groupCount);
		return okPaged(rows, 1, 100, rows.length);
	}),

	http.post(`${MANAGE}/fee-plans`, async ({ request }) => {
		const body = (await request.json()) as Record<string, unknown>;
		return HttpResponse.json(
			{
				success: true,
				data: {
					id: 99,
					branchId: body['branchId'] ?? null,
					groupCount: 0,
					name: body['name'],
					amount: body['amount'],
					currency: body['currency'] ?? 'UZS',
					billingCycle: body['billingCycle'],
					// Deliberately does NOT echo dueDay/prorationMethod: the server's
					// DTO whitelist drops them, so a stale client cannot see its
					// override reflected back and think it took effect.
					isActive: true,
					createdAt: '2026-07-03T00:00:00Z',
					updatedAt: '2026-07-03T00:00:00Z',
				},
				meta: { timestamp: 'test' },
			},
			{ status: 201 },
		);
	}),

	http.patch(`${MANAGE}/fee-plans/:id`, async ({ params, request }) => {
		const feePlan = MOCK_FEE_PLANS.find((p) => p.id === Number(params['id']));
		if (!feePlan) return fail(404, 'FEE_PLAN_NOT_FOUND', 'Fee plan not found.');
		const body = (await request.json()) as Record<string, unknown>;
		// Retiring a plan a course still uses would silently stop billing its groups.
		if (body['isActive'] === false && feePlan.groupCount > 0) {
			return fail(
				409,
				'FEE_PLAN_IN_USE',
				'This fee plan cannot be deactivated while courses are using it.',
			);
		}
		return ok({ ...feePlan, ...body, updatedAt: '2026-07-04T00:00:00Z' });
	}),

	// ── Billing policy (one per tenant, READ-ONLY on this surface) ─────────────
	// There is deliberately no PUT: the policy is written from the internal
	// platform (`PUT /super-admin/tenants/:id/billing-policy`). Mocking a write
	// here would let a test pass against an endpoint that no longer exists.
	http.get(`${MANAGE}/billing-policy`, () => ok(MOCK_BILLING_POLICY)),

	// ── Invoices — manual generate-monthly run ─────────────────────────────────
	http.post(`${MANAGE}/invoices/generate-monthly`, async ({ request }) => {
		const body = (await request.json()) as {
			year?: number;
			month?: number;
			branchId?: number;
		};
		const now = new Date();
		return ok({
			period: {
				year: body.year ?? now.getFullYear(),
				month: body.month ?? now.getMonth() + 1,
			},
			generated: 3,
			prorated: 1,
			skippedExisting: 1,
			skippedNoFeePlan: 0,
			skippedZeroConsumption: 1,
			skippedSuspended: 0,
			errors: [] as { message: string }[],
		});
	}),

	// ── Wallet credit application ────────────────────────────────────────────
	http.post(`${MANAGE}/invoices/:id/apply-credit`, ({ params }) => {
		const invoiceId = Number(params['id']);
		const wallet = getOrCreateMockWallet(MOCK_INVOICE_DETAIL.studentId);
		const applied = Math.min(wallet.balance, MOCK_INVOICE_DETAIL.amountDue);
		if (applied > 0) {
			wallet.balance -= applied;
			pushMockWalletTransaction(wallet, {
				type: 'INVOICE_APPLICATION',
				amount: -applied,
				invoiceId,
				paymentId: null,
				creditNoteId: null,
				notes: null,
			});
		}
		return ok({
			applied,
			walletBalance: wallet.balance,
			invoice: {
				...MOCK_INVOICE_DETAIL,
				id: invoiceId,
				amountPaid: MOCK_INVOICE_DETAIL.amountPaid + applied,
				amountDue: MOCK_INVOICE_DETAIL.amountDue - applied,
			},
		});
	}),

	// ── Credit notes ─────────────────────────────────────────────────────────
	http.get(`${MANAGE}/invoices/:id/credit-notes`, ({ params }) =>
		ok(MOCK_CREDIT_NOTES.get(Number(params['id'])) ?? []),
	),

	http.post(`${MANAGE}/invoices/:id/credit-notes`, async ({ params, request }) => {
		const invoiceId = Number(params['id']);
		const body = (await request.json()) as { amount: number; reason: string };
		if (body.amount <= 0) {
			return fail(
				422,
				'CREDIT_NOTE_AMOUNT_INVALID',
				'Amount must be greater than 0.',
			);
		}
		const existing = MOCK_CREDIT_NOTES.get(invoiceId) ?? [];
		const created: MockCreditNote = {
			id: 900 + existing.length,
			creditNoteNumber: `CN-2026-${String(900 + existing.length).padStart(5, '0')}`,
			invoiceId,
			studentId: MOCK_INVOICE_DETAIL.studentId,
			amount: body.amount,
			reason: body.reason,
			createdByUserId: 1,
			createdAt: '2026-07-06T12:00:00Z',
		};
		MOCK_CREDIT_NOTES.set(invoiceId, [...existing, created]);
		return HttpResponse.json(
			{ success: true, data: created, meta: { timestamp: 'test' } },
			{ status: 201 },
		);
	}),

	// ── Payments ─────────────────────────────────────────────────────────────
	http.get(`${MANAGE}/payments`, ({ request }) => {
		const url = new URL(request.url);
		const branchIds = readBranchIds(url);
		const studentId = url.searchParams.get('studentId');
		const invoiceId = url.searchParams.get('invoiceId');
		const method = url.searchParams.get('method');
		const status = url.searchParams.get('status');
		const from = url.searchParams.get('from');
		const to = url.searchParams.get('to');
		const page = Number(url.searchParams.get('page') ?? 1);
		const limit = Number(url.searchParams.get('limit') ?? 20);

		let rows = MOCK_PAYMENTS;
		if (branchIds) rows = rows.filter((p) => branchIds.includes(p.branchId));
		if (studentId) rows = rows.filter((p) => p.studentId === Number(studentId));
		if (invoiceId) rows = rows.filter((p) => p.invoiceId === Number(invoiceId));
		if (method) rows = rows.filter((p) => p.method === method);
		if (status) rows = rows.filter((p) => p.status === status);
		if (from) rows = rows.filter((p) => (p.paidAt ?? '') >= from);
		if (to) rows = rows.filter((p) => (p.paidAt ?? '') <= `${to}T23:59:59Z`);

		const total = rows.length;
		const start = (page - 1) * limit;
		return okPaged(rows.slice(start, start + limit), page, limit, total);
	}),

	http.get(`${MANAGE}/payments/:id`, ({ params }) => {
		const detail = mockPaymentDetail(Number(params['id']));
		if (!detail) return fail(404, 'PAYMENT_NOT_FOUND', 'Payment not found.');
		return ok(detail);
	}),

	http.post(`${MANAGE}/payments/:id/refund`, async ({ params, request }) => {
		const payment = MOCK_PAYMENTS.find((p) => p.id === Number(params['id']));
		if (!payment) return fail(404, 'PAYMENT_NOT_FOUND', 'Payment not found.');
		if (payment.status !== 'SUCCEEDED') {
			return fail(
				422,
				'PAYMENT_NOT_REFUNDABLE',
				'Only succeeded payments can be refunded.',
			);
		}
		const body = (await request.json()) as {
			amount: number;
			destination: 'WALLET' | 'CASH_OUT';
			notes?: string | null;
		};
		if (body.destination === 'WALLET' && payment.invoiceId == null) {
			return fail(
				422,
				'REFUND_DESTINATION_INVALID',
				'A wallet-only payment can only be refunded as cash.',
			);
		}
		if (body.amount > payment.amount) {
			return fail(
				422,
				'PAYMENT_REFUND_EXCEEDS',
				'Refund amount exceeds what remains on this payment.',
			);
		}
		return HttpResponse.json(
			{
				success: true,
				data: {
					id: 700 + payment.id,
					paymentId: payment.id,
					invoiceId: payment.invoiceId,
					amount: body.amount,
					destination: body.destination,
					creditTransactionId:
						body.destination === 'WALLET' ? 1000 + payment.id : null,
					notes: body.notes ?? null,
					createdByUserId: 1,
					createdAt: '2026-07-06T12:00:00Z',
				},
				meta: { timestamp: 'test' },
			},
			{ status: 201 },
		);
	}),

	// ── Leads / Pipeline ───────────────────────────────────────────────────────
	http.get(`${MANAGE}/leads`, ({ request }) => {
		const url = new URL(request.url);
		const rows = filterLeads(url);
		const status = url.searchParams.get('status');

		if (status) {
			// Column mode: a flat paginated single column.
			const page = Number(url.searchParams.get('page') ?? 1);
			const limit = Number(url.searchParams.get('limit') ?? 12);
			const col = rows.filter((l) => l.status === status);
			const start = (page - 1) * limit;
			return okPaged(
				col.slice(start, start + limit).map(leadCard),
				page,
				limit,
				col.length,
			);
		}

		// Board mode: one column per status in fixed order.
		const limit = Number(url.searchParams.get('limit') ?? 12);
		const columns = LEAD_STATUS_ORDER.map((s) => {
			const col = rows.filter((l) => l.status === s);
			return {
				status: s,
				total: col.length,
				items: col.slice(0, limit).map(leadCard),
			};
		});
		return ok({ columns });
	}),

	http.get(`${MANAGE}/leads/:id`, ({ params }) => {
		const lead = MOCK_LEADS.find((l) => l.id === Number(params['id']));
		if (!lead) return fail(404, 'LEAD_NOT_FOUND', 'Lead not found.');
		return ok(leadDetail(lead));
	}),

	http.post(`${MANAGE}/leads`, async ({ request }) => {
		const body = (await request.json()) as Record<string, unknown>;
		const created: MockLead = {
			id: 999,
			firstName: String(body['firstName'] ?? ''),
			lastName: (body['lastName'] as string) ?? null,
			phoneNumber: String(body['phoneNumber'] ?? ''),
			source: String(body['source'] ?? 'OTHER'),
			status: 'NEW',
			branchId: Number(body['branchId'] ?? 1),
			courseInterest: null,
			assignedTo: null,
			email: (body['email'] as string) ?? null,
			notes: (body['notes'] as string) ?? null,
			convertedStudentId: null,
			activities: [
				{
					id: 1,
					type: 'STATUS_CHANGE',
					notes: 'Lead captured',
					scheduledAt: null,
					actorStaffId: null,
					actorName: null,
					createdAt: '2026-07-04T12:00:00Z',
				},
			],
			createdAt: '2026-07-04T12:00:00Z',
		};
		return HttpResponse.json(
			{ success: true, data: leadDetail(created), meta: { timestamp: 'test' } },
			{ status: 201 },
		);
	}),

	http.patch(`${MANAGE}/leads/:id/status`, async ({ params, request }) => {
		const lead = MOCK_LEADS.find((l) => l.id === Number(params['id']));
		if (!lead) return fail(404, 'LEAD_NOT_FOUND', 'Lead not found.');
		const body = (await request.json()) as { status: string };
		return ok(leadDetail({ ...lead, status: body.status }));
	}),

	http.patch(`${MANAGE}/leads/:id`, async ({ params, request }) => {
		const lead = MOCK_LEADS.find((l) => l.id === Number(params['id']));
		if (!lead) return fail(404, 'LEAD_NOT_FOUND', 'Lead not found.');
		const body = (await request.json()) as Partial<MockLead>;
		return ok(leadDetail({ ...lead, ...body }));
	}),

	http.post(`${MANAGE}/leads/:id/activities`, async ({ params, request }) => {
		const lead = MOCK_LEADS.find((l) => l.id === Number(params['id']));
		if (!lead) return fail(404, 'LEAD_NOT_FOUND', 'Lead not found.');
		const body = (await request.json()) as { type: string; notes?: string };
		const activity = {
			id: 555,
			type: body.type,
			notes: body.notes ?? null,
			scheduledAt: null,
			actorStaffId: 1,
			actorName: 'Dilnoza Tosheva',
			createdAt: '2026-07-04T13:00:00Z',
		};
		return HttpResponse.json(
			{ success: true, data: activity, meta: { timestamp: 'test' } },
			{ status: 201 },
		);
	}),

	http.post(`${MANAGE}/leads/:id/convert`, ({ params }) => {
		const lead = MOCK_LEADS.find((l) => l.id === Number(params['id']));
		if (!lead) return fail(404, 'LEAD_NOT_FOUND', 'Lead not found.');
		if (lead.status === 'LOST')
			return fail(400, 'LEAD_CONVERT_FROM_LOST', 'Cannot convert a lost lead.');
		return HttpResponse.json(
			{
				success: true,
				data: { id: 100, studentCode: 'STU-2026-0100' },
				meta: { timestamp: 'test' },
			},
			{ status: 201 },
		);
	}),

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
		const periodFrom = url.searchParams.get('periodFrom');
		const periodTo = url.searchParams.get('periodTo');
		const page = Number(url.searchParams.get('page') ?? 1);
		const limit = Number(url.searchParams.get('limit') ?? 20);

		let rows = MOCK_PAYROLLS;
		if (branchIds) rows = rows.filter((p) => branchIds.includes(p.branchId));
		if (status) rows = rows.filter((p) => p.status === status);
		if (staffId) rows = rows.filter((p) => p.staffId === Number(staffId));
		if (periodFrom) rows = rows.filter((p) => p.periodStart >= periodFrom);
		if (periodTo) rows = rows.filter((p) => p.periodEnd <= periodTo);

		const total = rows.length;
		const start = (page - 1) * limit;
		return okPaged(rows.slice(start, start + limit), page, limit, total);
	}),

	http.get(`${MANAGE}/payrolls/summary`, ({ request }) => {
		const url = new URL(request.url);
		const branchIds = readBranchIds(url);
		const status = url.searchParams.get('status');
		const staffId = url.searchParams.get('staffId');
		const periodFrom = url.searchParams.get('periodFrom');
		const periodTo = url.searchParams.get('periodTo');

		let rows = MOCK_PAYROLLS;
		if (branchIds) rows = rows.filter((p) => branchIds.includes(p.branchId));
		if (status) rows = rows.filter((p) => p.status === status);
		if (staffId) rows = rows.filter((p) => p.staffId === Number(staffId));
		if (periodFrom) rows = rows.filter((p) => p.periodStart >= periodFrom);
		if (periodTo) rows = rows.filter((p) => p.periodEnd <= periodTo);

		return ok({
			currency: 'UZS',
			totalGross: rows.reduce((sum, p) => sum + p.grossAmount, 0),
			totalDeductions: rows.reduce((sum, p) => sum + p.deductions, 0),
			totalNetPayable: rows.reduce((sum, p) => sum + p.netAmount, 0),
		});
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

/** `GET /manage/me` returning a specific resolved permission set (or an error). */
export const meHandlers = {
	withPermissions: (permissions: string[]) =>
		http.get(`${MANAGE}/me`, () =>
			ok({
				id: 2,
				firstName: 'Madina',
				lastName: 'Manager',
				email: null,
				phone: '+998901112201',
				avatarUrl: null,
				roles: ['MANAGER'],
				branchScope: [1],
				permissions,
			}),
		),
	serverError: http.get(`${MANAGE}/me`, () =>
		fail(500, 'INTERNAL_ERROR', 'Unexpected server error.'),
	),
};

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

export const billingPolicyHandlers = {
	forbidden: http.get(`${MANAGE}/billing-policy`, () =>
		fail(403, 'FORBIDDEN', 'You do not have permission.'),
	),
	serverError: http.get(`${MANAGE}/billing-policy`, () =>
		fail(500, 'INTERNAL_ERROR', 'Unexpected server error.'),
	),
};

export const feePlanHandlers = {
	empty: http.get(`${MANAGE}/fee-plans`, () => okPaged([], 1, 20, 0)),
	forbidden: http.get(`${MANAGE}/fee-plans`, () =>
		fail(403, 'FORBIDDEN', 'You do not have permission.'),
	),
	serverError: http.get(`${MANAGE}/fee-plans`, () =>
		fail(500, 'INTERNAL_ERROR', 'Unexpected server error.'),
	),
};

export const paymentHandlers = {
	empty: http.get(`${MANAGE}/payments`, () => okPaged([], 1, 20, 0)),
	forbidden: http.get(`${MANAGE}/payments`, () =>
		fail(403, 'FORBIDDEN', 'You do not have permission.'),
	),
	serverError: http.get(`${MANAGE}/payments`, () =>
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

export const leadHandlers = {
	empty: http.get(`${MANAGE}/leads`, () =>
		ok({
			columns: LEAD_STATUS_ORDER.map((s) => ({
				status: s,
				total: 0,
				items: [],
			})),
		}),
	),
	forbidden: http.get(`${MANAGE}/leads`, () =>
		fail(403, 'FORBIDDEN', 'You do not have permission.'),
	),
	serverError: http.get(`${MANAGE}/leads`, () =>
		fail(500, 'INTERNAL_ERROR', 'Unexpected server error.'),
	),
	// Column mode with four pages of 12 — exercises the "load more" pagination.
	columnPaged: http.get(`${MANAGE}/leads`, ({ request }) => {
		const url = new URL(request.url);
		const page = Number(url.searchParams.get('page') ?? 1);
		const limit = 12;
		const rows = Array.from({ length: limit }, (_, i) => {
			const id = (page - 1) * limit + i + 1;
			return {
				id,
				firstName: `Lead${id}`,
				lastName: null,
				phoneNumber: '+998900000000',
				source: 'WEBSITE',
				status: 'NEW',
				branchId: 1,
				courseInterest: null,
				assignedTo: null,
				latestActivity: null,
				createdAt: '2026-07-01T00:00:00Z',
			};
		});
		return okPaged(rows, page, limit, 40);
	}),
};
