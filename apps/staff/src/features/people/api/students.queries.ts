import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import type { PaginatedResult } from '@repo/api-client';

import { peopleKeys, type StudentListFilters } from './keys';

// ─── Domain types ────────────────────────────────────────────────────────────

export interface Branch {
	id: number;
	name: string;
	code: string;
	isMain: boolean;
	isActive: boolean;
}

export interface Group {
	id: number;
	code: string;
	name: string;
	branchId: number;
	courseId: number;
	courseName?: string;
	status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
}

export interface FeePlan {
	id: number;
	name: string;
	amount: number;
	cycle: string;
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
	emergencyContact?: { name: string; phone: string; relation: string } | null;
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
	groupCode: string;
	courseName: string;
	enrolledAt: string;
	status: 'ACTIVE' | 'COMPLETED' | 'DROPPED' | 'TRANSFERRED';
}

export interface AttendanceRecord {
	id: number;
	sessionDate: string;
	courseName: string;
	status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
}

export interface AttendanceSummary {
	rate?: number;
	records: AttendanceRecord[];
}

export interface Grade {
	id: number;
	assessmentName: string;
	date: string;
	score: number;
	maxScore: number;
}

export interface Invoice {
	id: number;
	invoiceCode: string;
	date: string;
	total: number;
	status: 'DRAFT' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'VOID' | 'REFUNDED';
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useStudents(filters: StudentListFilters) {
	return useQuery({
		queryKey: peopleKeys.studentList(filters),
		queryFn: () =>
			manageApi.getPaginated<Student>('/students', {
				params: filters,
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

export function useStudentAttendances(studentId: number) {
	return useQuery({
		queryKey: peopleKeys.studentAttendances(studentId),
		queryFn: () =>
			manageApi.get<AttendanceSummary>(`/students/${studentId}/attendances`),
		enabled: studentId > 0,
	});
}

export function useStudentResults(studentId: number) {
	return useQuery({
		queryKey: peopleKeys.studentResults(studentId),
		queryFn: () => manageApi.get<Grade[]>(`/students/${studentId}/results`),
		enabled: studentId > 0,
	});
}

export function useStudentInvoices(studentId: number) {
	return useQuery({
		queryKey: peopleKeys.studentInvoices(studentId),
		queryFn: () => manageApi.get<Invoice[]>(`/students/${studentId}/invoices`),
		enabled: studentId > 0,
	});
}

export function useBranches() {
	return useQuery({
		queryKey: peopleKeys.branches(),
		queryFn: () => manageApi.get<Branch[]>('/branches'),
		staleTime: 5 * 60 * 1000,
	});
}

export function useGroups(filters?: { branchId?: number }) {
	return useQuery({
		queryKey: peopleKeys.groups(filters),
		queryFn: () =>
			manageApi.getPaginated<Group>('/groups', {
				params: { ...filters, status: 'ACTIVE', limit: 100 },
			}) as Promise<PaginatedResult<Group>>,
		staleTime: 60_000,
	});
}

export function useFeePlans() {
	return useQuery({
		queryKey: peopleKeys.feePlans(),
		queryFn: () =>
			manageApi.getPaginated<FeePlan>('/fee-plans', {
				params: { limit: 100 },
			}) as Promise<PaginatedResult<FeePlan>>,
		staleTime: 5 * 60 * 1000,
	});
}
