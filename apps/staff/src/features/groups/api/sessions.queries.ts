import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { groupsKeys, type SessionCalendarFilters } from './keys';
import type { SessionCalendarItem, SessionDetail } from './groups.queries';

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Cross-group session calendar (`GET /manage/sessions`). `from`/`to` are
 * required (max 90-day window) and returned as a flat array, not paginated.
 */
export function useSessionCalendar(filters: SessionCalendarFilters, enabled = true) {
	return useQuery({
		queryKey: groupsKeys.sessionCalendar(filters),
		queryFn: () =>
			manageApi.get<SessionCalendarItem[]>('/sessions', { params: filters }),
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
