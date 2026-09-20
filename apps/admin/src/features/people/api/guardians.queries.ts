import { useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { peopleKeys } from './keys';
import type { GuardianLinkedStudent, StudentUser } from './students.queries';

/**
 * A guardian's detail view (`GET /manage/guardians/:id`), opened from the
 * student-detail Guardians tab. `id` is the guardian's user id, the same id
 * `students.mutations.ts`'s link/unlink calls expect as `guardianUserId`.
 */
export interface GuardianCandidate {
	user: StudentUser;
	/** False when the role is held but every link has since been removed. */
	isGuardian: boolean;
	students: GuardianLinkedStudent[];
}

export function useGuardian(id: number) {
	return useQuery({
		queryKey: peopleKeys.guardian(id),
		queryFn: () => manageApi.get<GuardianCandidate>(`/guardians/${id}`),
		enabled: id > 0,
	});
}
