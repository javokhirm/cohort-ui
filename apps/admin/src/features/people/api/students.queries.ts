import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import { useActiveBranchIds } from '@/store/branchStore';
import type { PaginatedResult } from '@repo/api-client';

import {
	peopleKeys,
	type StudentListFilters,
	type StudentPerformanceFilters,
} from './keys';

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

// ─── Performance tab ─────────────────────────────────────────────────────────

/**
 * The immutable grading scale a mark was stamped with when the teacher entered
 * it — never the group's currently active one. The API sends no prose for it
 * (only `type`/`maxPoints`), so the unit and scale name are composed and
 * translated client-side in `../lib/mark-format`.
 */
export interface MarkScale {
	configId: number;
	type: 'POINTS' | 'PERCENTAGE' | 'LETTER';
	/** Numeric max for POINTS/PERCENTAGE; null for LETTER. */
	maxPoints: number | null;
	allowHalf: boolean;
}

/** One session's daily mark, in its stamped scale. */
export interface SessionMark {
	id: number;
	scale: MarkScale;
	/** On the scale's own axis (e.g. 8 of 10); null for LETTER. */
	rawScore: number | null;
	/** A–F; null for POINTS/PERCENTAGE. */
	letter: string | null;
	/** 0–100 — the only figure comparable across scales. */
	normalizedPct: number;
	comment: string | null;
	markedByName: string | null;
	markedAt: string | null;
}

/**
 * One row of the Performance tab's session history. Attendance-driven, so
 * `mark: null` covers two cases the UI renders differently: an ABSENT/EXCUSED
 * class never expected a mark, while a PRESENT/LATE one is teacher backlog
 * ("Not marked"). `status` is what tells them apart.
 */
export interface PerformanceSession {
	/** The attendance record id — the row identity; a mark may not exist. */
	id: number;
	sessionId: number;
	sessionDate: string;
	groupId: number;
	groupName: string;
	topic: string | null;
	status: AttendanceStatus;
	/** The attendance note, not the mark's comment. */
	note: string | null;
	mark: SessionMark | null;
}

/**
 * The Performance tab's two KPI cards. Aggregated over the whole period/group
 * window rather than the visible page, so paging the list never moves them.
 */
export interface PerformanceSummary {
	attendance: {
		/** PRESENT+LATE over every marked record; null when nothing was marked. */
		rate: number | null;
		counts: { present: number; absent: number; late: number; excused: number };
		totalMarked: number;
		/** The floor `belowAlertThreshold` was evaluated against, server-owned. */
		alertThresholdPct: number;
		belowAlertThreshold: boolean;
	};
	marks: {
		averagePct: number | null;
		/**
		 * The average on the scale's own axis (e.g. 8.4 of 10) — non-null only
		 * when every mark in the window shares one numeric scale. Fall back to
		 * `averagePct` when it is null.
		 */
		averageRaw: number | null;
		markedCount: number;
		/** Attended classes with no mark yet — teacher backlog. */
		unmarkedCount: number;
		scales: MarkScale[];
	};
	/** The first/last session actually found — not the requested bounds. */
	span: { firstSessionDate: string | null; lastSessionDate: string | null };
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

/**
 * The Performance tab's KPI cards. Takes the period/group filters but **not**
 * `status` or `page`: the cards aggregate the whole window, so neither the
 * status select nor paging the list below may refetch or move them.
 */
export function useStudentPerformance(
	studentId: number,
	filters: Omit<StudentPerformanceFilters, 'status'>,
) {
	return useQuery({
		queryKey: peopleKeys.studentPerformance(studentId, filters),
		queryFn: () =>
			manageApi.get<PerformanceSummary>(`/students/${studentId}/performance`, {
				params: filters,
			}),
		enabled: studentId > 0,
		placeholderData: keepPreviousData,
	});
}

/** The Performance tab's session history — attendance + that session's mark. */
export function useStudentPerformanceSessions(
	studentId: number,
	filters: StudentPerformanceFilters,
	page: number,
) {
	return useQuery({
		queryKey: peopleKeys.studentPerformanceSessions(studentId, filters, page),
		queryFn: () =>
			manageApi.getPaginated<PerformanceSession>(
				`/students/${studentId}/performance/sessions`,
				{ params: { ...filters, page, limit: STUDENT_TAB_PAGE_SIZE } },
			) as Promise<PaginatedResult<PerformanceSession>>,
		enabled: studentId > 0,
		placeholderData: keepPreviousData,
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
