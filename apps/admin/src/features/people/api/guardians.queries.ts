import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import type { PaginatedResult } from '@repo/api-client';

import { peopleKeys, type GuardianListFilters } from './keys';
import type { GuardianLinkedStudent, StudentUser } from './students.queries';

/**
 * One guardian directory row (`GET /manage/guardians` list mode and
 * `GET /manage/guardians/:id`) — the Guardians page. `id` is the guardian's
 * user id, the same id `students.mutations.ts`'s link/unlink calls expect as
 * `guardianUserId`.
 */
export interface GuardianCandidate {
	user: StudentUser;
	/** False when the role is held but every link has since been removed. */
	isGuardian: boolean;
	students: GuardianLinkedStudent[];
}

export function useGuardians(filters: GuardianListFilters) {
	return useQuery({
		queryKey: peopleKeys.guardianList(filters),
		queryFn: () =>
			manageApi.getPaginated<GuardianCandidate>('/guardians', {
				params: filters,
			}) as Promise<PaginatedResult<GuardianCandidate>>,
		placeholderData: keepPreviousData,
	});
}

export function useGuardian(id: number) {
	return useQuery({
		queryKey: peopleKeys.guardian(id),
		queryFn: () => manageApi.get<GuardianCandidate>(`/guardians/${id}`),
		enabled: id > 0,
	});
}
