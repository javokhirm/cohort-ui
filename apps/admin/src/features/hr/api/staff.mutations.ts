import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { hrKeys } from './keys';
import type {
	EmploymentType,
	PayrollType,
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
	payrollType?: PayrollType;
	/** Required when `payrollType` is `PERCENT`. */
	payrollPercent?: number;
	roleName?: StaffRoleName;
	/**
	 * Initial login password (8–128). Applied only when `phone` belongs to a new
	 * user — an existing account keeps its credentials. Omit to let the member set
	 * their own later from their account page.
	 */
	password?: string;
}

export interface UpdateStaffInput {
	id: number;
	branchId?: number;
	position?: string;
	department?: string;
	specialization?: string[];
	employmentType?: EmploymentType;
	baseSalary?: number;
	payrollType?: PayrollType;
	payrollPercent?: number;
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

/**
 * Operator reset of a staff member's login password. Same `PATCH /staff/:id`
 * endpoint and `staff.update` permission as {@link useUpdateStaff}, sent on its own
 * so a reset is never bundled with an unrelated profile save.
 *
 * No cache invalidation: the password appears in no response, so nothing cached
 * goes stale. The server refuses a non-OWNER resetting an OWNER with a 403
 * `STAFF_PASSWORD_RESET_FORBIDDEN`, and does not revoke the member's existing
 * sessions — the new password applies from their next login.
 */
export function useChangeStaffPassword(staffId: number) {
	return useMutation({
		mutationFn: (password: string) =>
			manageApi.patch<StaffResponse>(`/staff/${staffId}`, { password }),
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
