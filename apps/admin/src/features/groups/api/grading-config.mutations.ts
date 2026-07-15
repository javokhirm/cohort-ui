import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { type GradingConfig, type GradingType } from './grading-config.queries';
import { groupsKeys } from './keys';

/**
 * Switch a group's active grading scale. `maxPoints` is required for POINTS/
 * PERCENTAGE and omitted for LETTER; `allowHalf` applies to POINTS only. The
 * server keeps exactly one active config and preserves prior marks.
 */
export interface SetGradingConfigInput {
	type: GradingType;
	maxPoints?: number;
	allowHalf?: boolean;
}

/** Switch a group's active grading config (`POST /manage/groups/:id/grading-config`). */
export function useSetGroupGradingConfig(groupId: number) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: SetGradingConfigInput) =>
			manageApi.post<GradingConfig>(`/groups/${groupId}/grading-config`, input),
		onSuccess: () => {
			void qc.invalidateQueries({
				queryKey: groupsKeys.groupGradingConfig(groupId),
			});
			void qc.invalidateQueries({ queryKey: groupsKeys.groupDetail(groupId) });
		},
	});
}
