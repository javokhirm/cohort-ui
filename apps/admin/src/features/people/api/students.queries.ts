import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import { useActiveBranchIds } from '@/store/branchStore';
import type { PaginatedResult } from '@repo/api-client';

import { peopleKeys, type StudentListFilters } from './keys';

/**
 * Rows per page in the student-detail tabs (attendance, grades, billing). Small
 * on purpose — these sit inside a tab panel, not a full-page table.
 */
export const STUDENT_TAB_PAGE_SIZE = 10;

// ─── Domain types ────────────────────────────────────────────────────────────

export interface Group {
	id: number;
	name: string;
	branchId: number;
	courseId: number;
	courseName?: string;
	status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

export interface StudentUser {
	id: number;
	firstName: string;
	lastName: string;
	phone: string;
	email: string | null;
	avatarUrl: string | null;
}

export interface Student {
	id: number;
	studentCode: string;
	branchId: number;
	status: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'SUSPENDED';
	enrolledAt: string;
	dateOfBirth: string | null;
	gender: 'M' | 'F' | 'O' | null;
	user: StudentUser;
	// Detail-only fields — present on single-student responses (GET /:id, POST, PATCH), absent on list rows
	address?: string | null;
	notes?: string | null;
	guardians?: Guardian[];
	activeEnrollmentsCount?: number;
	// List-enrichment fields — included when the backend projects them onto list rows
	groups?: Array<{ id: number; code: string }>;
	primaryGuardian?: { guardianUserId: number; name: string } | null;
	balance?: number;
}

export interface Guardian {
	id: number;
	guardianUserId: number;
	relation: 'mother' | 'father' | 'guardian';
	isPrimary: boolean;
	canPickup: boolean;
	user: StudentUser;
}

export interface Enrollment {
	id: number;
	groupId: number;
	groupName: string;
	courseId: number;
	courseName: string;
	/** Per-enrollment fee-plan override, if any. */
	feePlanId: number | null;
	enrolledAt: string;
	status: 'ACTIVE' | 'SUSPENDED' | 'COMPLETED' | 'DROPPED' | 'TRANSFERRED';
	/** Set when `status` is `DROPPED`. */
	dropReason: string | null;
	/** Set when `status` is `COMPLETED`. */
	completedAt: string | null;
}

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

/** One row of the attendance tab — a marked record in one of the student's groups. */
export interface AttendanceRecord {
	id: number;
	sessionDate: string;
	groupId: number;
	groupName: string;
	status: AttendanceStatus;
	note: string | null;
}

/**
 * The attendance tab's rate card. Computed over the student's whole marked
 * history, not a rolling window. `rate` is null when nothing has been marked —
 * distinct from a genuine 0%, which is why `totalMarked` comes along.
 */
export interface AttendanceSummary {
	rate: number | null;
	counts: { present: number; absent: number; late: number; excused: number };
	streak: number;
	totalMarked: number;
}

export type AssessmentType = 'QUIZ' | 'MIDTERM' | 'FINAL' | 'MOCK' | 'HOMEWORK';

/**
 * One row of the grades tab. Published assessments only — the backend hard-filters
 * unpublished ones, so an in-progress grading run never surfaces here.
 */
export interface StudentResult {
	id: number;
	assessmentId: number;
	groupId: number;
	groupName: string;
	title: string;
	type: AssessmentType;
	examDate: string | null;
	/** Null when the assessment exists but this student has no score yet. */
	score: number | null;
	maxScore: number;
	gradeLabel: string | null;
	percentileRank: number | null;
	feedback: string | null;
	teacherName: string | null;
	gradedAt: string | null;
}

export type InvoiceStatus = 'DRAFT' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'VOID';

export interface Invoice {
	id: number;
	branchId: number;
	invoiceNumber: string;
	studentId: number;
	studentName: string;
	enrollmentId: number | null;
	issueDate: string;
	dueDate: string;
	subtotal: number;
	discountAmount: number;
	taxAmount: number;
	total: number;
	amountPaid: number;
	/** `total − amountPaid`, never negative. */
	amountDue: number;
	currency: string;
	status: InvoiceStatus;
	notes: string | null;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useStudents(filters: StudentListFilters) {
	// The global branch selection is part of the effective filters (and thus the
	// query key), so changing the selector refetches. An explicit caller value
	// still wins.
	const activeBranchIds = useActiveBranchIds();
	const effectiveFilters: StudentListFilters = {
		...filters,
		branchIds: filters.branchIds ?? activeBranchIds,
	};
	return useQuery({
		queryKey: peopleKeys.studentList(effectiveFilters),
		queryFn: () =>
			manageApi.getPaginated<Student>('/students', {
				params: effectiveFilters,
			}) as Promise<PaginatedResult<Student>>,
		placeholderData: keepPreviousData,
	});
}

export function useStudent(id: number) {
	return useQuery({
		queryKey: peopleKeys.student(id),
		queryFn: () => manageApi.get<Student>(`/students/${id}`),
		enabled: id > 0,
	});
}

export function useStudentGuardians(studentId: number) {
	return useQuery({
		queryKey: peopleKeys.studentGuardians(studentId),
		queryFn: () => manageApi.get<Guardian[]>(`/students/${studentId}/guardians`),
		enabled: studentId > 0,
	});
}

export function useStudentEnrollments(studentId: number) {
	return useQuery({
		queryKey: peopleKeys.studentEnrollments(studentId),
		queryFn: () => manageApi.get<Enrollment[]>(`/students/${studentId}/enrollments`),
		enabled: studentId > 0,
	});
}

export function useStudentAttendances(studentId: number, page: number) {
	return useQuery({
		queryKey: peopleKeys.studentAttendances(studentId, page),
		queryFn: () =>
			manageApi.getPaginated<AttendanceRecord>(
				`/students/${studentId}/attendances`,
				{ params: { page, limit: STUDENT_TAB_PAGE_SIZE } },
			) as Promise<PaginatedResult<AttendanceRecord>>,
		enabled: studentId > 0,
		placeholderData: keepPreviousData,
	});
}

/**
 * The rate card above the attendance list. Separate from the list query on
 * purpose: it aggregates the whole history, so it must not refetch when the
 * user pages through the records below it.
 */
export function useStudentAttendanceSummary(studentId: number) {
	return useQuery({
		queryKey: peopleKeys.studentAttendanceSummary(studentId),
		queryFn: () =>
			manageApi.get<AttendanceSummary>(
				`/students/${studentId}/attendances/summary`,
			),
		enabled: studentId > 0,
	});
}

export function useStudentResults(studentId: number, page: number) {
	return useQuery({
		queryKey: peopleKeys.studentResults(studentId, page),
		queryFn: () =>
			manageApi.getPaginated<StudentResult>(`/students/${studentId}/results`, {
				params: { page, limit: STUDENT_TAB_PAGE_SIZE },
			}) as Promise<PaginatedResult<StudentResult>>,
		enabled: studentId > 0,
		placeholderData: keepPreviousData,
	});
}

export function useStudentInvoices(studentId: number, page: number) {
	return useQuery({
		queryKey: peopleKeys.studentInvoices(studentId, page),
		queryFn: () =>
			manageApi.getPaginated<Invoice>(`/students/${studentId}/invoices`, {
				params: { page, limit: STUDENT_TAB_PAGE_SIZE },
			}) as Promise<PaginatedResult<Invoice>>,
		enabled: studentId > 0,
		placeholderData: keepPreviousData,
	});
}

export function useGroups(filters?: { branchIds?: number[] }) {
	// Caller-provided branch scope (e.g. the create-student form's chosen branch)
	// wins over the global selector.
	const activeBranchIds = useActiveBranchIds();
	const effectiveFilters = {
		...filters,
		branchIds: filters?.branchIds ?? activeBranchIds,
	};
	return useQuery({
		queryKey: peopleKeys.groups(effectiveFilters),
		queryFn: () =>
			manageApi.getPaginated<Group>('/groups', {
				params: { ...effectiveFilters, status: 'ACTIVE', limit: 100 },
			}) as Promise<PaginatedResult<Group>>,
		staleTime: 60_000,
	});
}
