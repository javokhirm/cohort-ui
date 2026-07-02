import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import { useActiveBranchIds } from '@/store/branchStore';

import { groupsKeys, type SessionCalendarFilters } from './keys';
import type { SessionCalendarItem, SessionDetail } from './groups.queries';

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Cross-group session calendar (`GET /manage/sessions`). `from`/`to` are
 * required (max 90-day window) and returned as a flat array, not paginated.
 */
export function useSessionCalendar(filters: SessionCalendarFilters, enabled = true) {
	// The global branch selection is part of the effective filters (and thus the
	// query key), so changing the selector refetches. An explicit caller value
	// still wins.
	const activeBranchIds = useActiveBranchIds();
	const effectiveFilters: SessionCalendarFilters = {
		...filters,
		branchIds: filters.branchIds ?? activeBranchIds,
	};
	return useQuery({
		queryKey: groupsKeys.sessionCalendar(effectiveFilters),
		queryFn: () =>
			manageApi.get<SessionCalendarItem[]>('/sessions', {
				params: effectiveFilters,
			}),
		placeholderData: keepPreviousData,
		enabled,
	});
}

/** Single session detail incl. student roster (`GET /manage/sessions/:id`). */
export function useSession(id: number | null) {
	return useQuery({
		queryKey: groupsKeys.sessionDetail(id ?? 0),
		queryFn: () => manageApi.get<SessionDetail>(`/sessions/${id}`),
		enabled: id != null && id > 0,
	});
}
