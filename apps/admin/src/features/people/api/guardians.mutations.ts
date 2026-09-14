import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { peopleKeys } from './keys';
import type { GuardianCandidate } from './guardians.queries';

export interface UpdateGuardianInput {
	id: number;
	firstName?: string;
	lastName?: string;
	/** `null` clears it. */
	phone?: string | null;
}

export function useUpdateGuardian() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...body }: UpdateGuardianInput) =>
			manageApi.patch<GuardianCandidate>(`/guardians/${id}`, body),
		onSuccess: (_data, variables) => {
			void qc.invalidateQueries({ queryKey: peopleKeys.guardian(variables.id) });
			void qc.invalidateQueries({ queryKey: peopleKeys.guardians() });
		},
	});
}

export function useDeleteGuardian() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (id: number) => manageApi.delete(`/guardians/${id}`),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: peopleKeys.guardians() });
		},
	});
}
