import { useMutation, useQueryClient } from '@tanstack/react-query';

import { teachApi } from '@/api/apiClient';

import type { GradingType } from './marks.queries';
import { type GradingConfig, gradingConfigKeys } from './grading-config.queries';
import { marksKeys } from './marks.queries';
import { marksGridKeys } from './marks-grid.queries';

/**
 * Switch a group's active grading scale. Exactly one active config is kept: the
 * server deactivates the current one and inserts a new immutable row, so marks
 * already entered keep their original scale. `maxPoints` is required for POINTS/
 * PERCENTAGE and ignored for LETTER; `allowHalf` applies to POINTS only.
 */
export interface SaveGradingConfigInput {
	type: GradingType;
	maxPoints?: number | null;
	allowHalf?: boolean;
}

/**
 * Switch a group's active grading config (`POST /teach/groups/:id/grading-config`).
 * On success, refresh the config (sheet), the group's month grid, and any open
 * session-marks sheet, since the active scale drives all three.
 */
export function useSetGradingConfig(groupId: number) {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: SaveGradingConfigInput) =>
			teachApi.post<GradingConfig>(`/groups/${groupId}/grading-config`, input),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: gradingConfigKeys.group(groupId) });
			void qc.invalidateQueries({ queryKey: marksGridKeys.all });
			void qc.invalidateQueries({ queryKey: marksKeys.all });
		},
	});
}
