import { useQuery } from '@tanstack/react-query';

import { teachApi } from '@/api/apiClient';

import type { GradingType } from './marks.queries';

/**
 * One grading config row — the active one, or a historical immutable snapshot
 * (`GradingConfigResponseDto`). Hand-mirrored: the teach controllers ship no
 * response schema to generate.
 */
export interface GradingConfig {
	id: number;
	groupId: number;
	type: GradingType;
	maxPoints: number | null;
	allowHalf: boolean;
	isActive: boolean;
	createdByStaffId: number | null;
	createdAt: string;
	updatedAt: string;
}

/**
 * A group's grading configuration (`GET /teach/groups/:id/grading-config`): the
 * single active config plus the immutable history of superseded ones (newest
 * first). Hand-mirrored from `GroupGradingConfigResponseDto`.
 */
export interface GroupGradingConfig {
	current: GradingConfig | null;
	history: GradingConfig[];
}

export const gradingConfigKeys = {
	all: ['grading-config'] as const,
	group: (groupId: number) => [...gradingConfigKeys.all, groupId] as const,
};

/** A group's active grading config + history — backs the grading-scale sheet. */
export function useGradingConfig(groupId: number, enabled = true) {
	return useQuery({
		queryKey: gradingConfigKeys.group(groupId),
		queryFn: () =>
			teachApi.get<GroupGradingConfig>(`/groups/${groupId}/grading-config`),
		enabled,
	});
}
