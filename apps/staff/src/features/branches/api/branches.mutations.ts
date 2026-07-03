import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import { branchesKeys, type Branch } from '@/api/branches';

// ─── Input types ─────────────────────────────────────────────────────────────
// Mirror the backend `CreateBranchDto` / `UpdateBranchDto` (api-reference §3.1).

export interface CreateBranchInput {
	name: string;
	code: string;
	address?: string;
	phone?: string;
	email?: string;
	timezone?: string;
	isMain?: boolean;
}

export interface UpdateBranchInput {
	id: number;
	name?: string;
	address?: string;
	phone?: string;
	email?: string;
	timezone?: string;
	isMain?: boolean;
	isActive?: boolean;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateBranch() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateBranchInput) =>
			manageApi.post<Branch>('/branches', input),
		onSuccess: () => {
			// Branches are cross-feature reference data (selector, room/staff/course
			// pickers), so invalidate the whole namespace.
			void qc.invalidateQueries({ queryKey: branchesKeys.all });
		},
	});
}

export function useUpdateBranch() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...body }: UpdateBranchInput) =>
			manageApi.patch<Branch>(`/branches/${id}`, body),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: branchesKeys.all });
		},
	});
}
