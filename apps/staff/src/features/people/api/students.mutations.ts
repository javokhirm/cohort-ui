import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { peopleKeys } from './keys';
import type { Guardian, Student } from './students.queries';

// ─── Input types ─────────────────────────────────────────────────────────────

export interface CreateStudentInput {
	branchId: number;
	firstName: string;
	lastName: string;
	phone: string;
	email?: string;
	dateOfBirth?: string;
	gender?: 'M' | 'F' | 'O';
	address?: string;
	emergencyContact?: { name: string; phone: string; relation: string };
	notes?: string;
}

export interface UpdateStudentInput {
	id: number;
	branchId?: number;
	dateOfBirth?: string;
	gender?: 'M' | 'F' | 'O';
	address?: string;
	emergencyContact?: { name: string; phone: string; relation: string };
	notes?: string;
	status?: 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'SUSPENDED';
}

export interface AddGuardianInput {
	studentId: number;
	phone: string;
	firstName?: string;
	lastName?: string;
	relation: 'mother' | 'father' | 'guardian';
	isPrimary?: boolean;
	canPickup?: boolean;
}

export interface EnrollStudentInput {
	groupId: number;
	studentId: number;
	feePlanId?: number | null;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateStudent() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateStudentInput) =>
			manageApi.post<Student>('/students', input),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: peopleKeys.students() });
		},
	});
}

export function useUpdateStudent() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...body }: UpdateStudentInput) =>
			manageApi.patch<Student>(`/students/${id}`, body),
		onSuccess: (_data, variables) => {
			void qc.invalidateQueries({ queryKey: peopleKeys.student(variables.id) });
			void qc.invalidateQueries({ queryKey: peopleKeys.students() });
		},
	});
}

export function useDeleteStudent() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => manageApi.delete(`/students/${id}`),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: peopleKeys.students() });
		},
	});
}

export function useAddGuardian() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ studentId, ...body }: AddGuardianInput) =>
			manageApi.post<Guardian>(`/students/${studentId}/guardians`, body),
		onSuccess: (_data, variables) => {
			void qc.invalidateQueries({
				queryKey: peopleKeys.studentGuardians(variables.studentId),
			});
		},
	});
}

export function useRemoveGuardian() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({
			studentId,
			guardianId,
		}: {
			studentId: number;
			guardianId: number;
		}) => manageApi.delete(`/students/${studentId}/guardians/${guardianId}`),
		onSuccess: (_data, variables) => {
			void qc.invalidateQueries({
				queryKey: peopleKeys.studentGuardians(variables.studentId),
			});
		},
	});
}

export function useEnrollStudent() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ groupId, studentId, feePlanId }: EnrollStudentInput) =>
			manageApi.post<void>(`/groups/${groupId}/enrollments`, {
				studentIds: [studentId],
				feePlanId: feePlanId ?? null,
			}),
		onSuccess: (_data, variables) => {
			void qc.invalidateQueries({
				queryKey: peopleKeys.studentEnrollments(variables.studentId),
			});
			void qc.invalidateQueries({ queryKey: peopleKeys.students() });
		},
	});
}
