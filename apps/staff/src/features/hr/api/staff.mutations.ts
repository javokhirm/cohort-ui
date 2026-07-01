import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { hrKeys } from './keys';
import type {
	EmploymentType,
	StaffResponse,
	StaffRoleName,
	StaffStatus,
} from './staff.queries';

// ─── Input types ─────────────────────────────────────────────────────────────

export interface CreateStaffInput {
	branchId: number;
	firstName: string;
	lastName: string;
	phone: string;
	email?: string;
	position?: string;
	department?: string;
	specialization?: string[];
	hireDate?: string;
	employmentType?: EmploymentType;
	baseSalary?: number;
	roleName?: StaffRoleName;
}

export interface UpdateStaffInput {
	id: number;
	branchId?: number;
	position?: string;
	department?: string;
	specialization?: string[];
	employmentType?: EmploymentType;
	baseSalary?: number;
	status?: StaffStatus;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateStaff() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateStaffInput) =>
			manageApi.post<StaffResponse>('/staff', input),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: hrKeys.staff() });
		},
	});
}

export function useUpdateStaff() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...body }: UpdateStaffInput) =>
			manageApi.patch<StaffResponse>(`/staff/${id}`, body),
		onSuccess: (_data, variables) => {
			void qc.invalidateQueries({ queryKey: hrKeys.staffDetail(variables.id) });
			void qc.invalidateQueries({ queryKey: hrKeys.staff() });
		},
	});
}

export function useDeleteStaff() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => manageApi.delete(`/staff/${id}`),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: hrKeys.staff() });
		},
	});
}
