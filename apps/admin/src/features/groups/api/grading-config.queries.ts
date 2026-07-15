import { useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { groupsKeys } from './keys';

/** Grading-config scale type (mirrors the backend `GRADING_CONFIG_TYPES`). */
export const GRADING_CONFIG_TYPES = ['POINTS', 'PERCENTAGE', 'LETTER'] as const;
export type GradingType = (typeof GRADING_CONFIG_TYPES)[number];

/**
 * One grading config row — the active one, or a historical immutable snapshot
 * (`GradingConfigResponseDto`). Hand-typed like the rest of this feature: the
 * generated OpenAPI types expose request DTOs but not response bodies.
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
 * A group's grading configuration (`GET /manage/groups/:id/grading-config`): the
 * single active config plus the immutable history of superseded ones (newest
 * first). Mirrors `GroupGradingConfigResponseDto`.
 */
export interface GroupGradingConfig {
	current: GradingConfig | null;
	history: GradingConfig[];
}

/** A group's active grading config + history — backs the grading-scale section. */
export function useGroupGradingConfig(groupId: number, enabled = true) {
	return useQuery({
		queryKey: groupsKeys.groupGradingConfig(groupId),
		queryFn: () =>
			manageApi.get<GroupGradingConfig>(`/groups/${groupId}/grading-config`),
		enabled,
	});
}
