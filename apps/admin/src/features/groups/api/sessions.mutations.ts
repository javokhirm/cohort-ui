import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { groupsKeys } from './keys';
import type { SessionDetail } from './groups.queries';

/**
 * The statuses `PATCH /manage/sessions/:id` accepts. `COMPLETED` is absent by
 * design — the backend derives it from the clock once a session's end time
 * passes and rejects it here (400), because a caller who could pre-complete a
 * class would inflate a teacher's payroll.
 */
export type PatchableSessionStatus = 'SCHEDULED' | 'CANCELLED';

// ─── Input types ─────────────────────────────────────────────────────────────

/**
 * Session override (`PATCH /manage/sessions/:id`) — reschedule, room change,
 * substitute teacher, set topic, cancel, or restore a cancelled session.
 * Room/teacher changes are conflict-checked server-side (409 on double-book);
 * `CANCELLED` requires a `cancellationReason`.
 */
export interface UpdateSessionInput {
	id: number;
	/** Group id — used only to invalidate the group's session list on success. */
	groupId?: number;
	sessionDate?: string;
	startTime?: string;
	endTime?: string;
	roomId?: number | null;
	teacherId?: number | null;
	topic?: string | null;
	status?: PatchableSessionStatus;
	cancellationReason?: string | null;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useUpdateSession() {
	const qc = useQueryClient();
	return useMutation({
		// `groupId` is client-only (cache invalidation); keep it out of the body.
		mutationFn: (input: UpdateSessionInput) =>
			manageApi.patch<SessionDetail>(`/sessions/${input.id}`, {
				sessionDate: input.sessionDate,
				startTime: input.startTime,
				endTime: input.endTime,
				roomId: input.roomId,
				teacherId: input.teacherId,
				topic: input.topic,
				status: input.status,
				cancellationReason: input.cancellationReason,
			}),
		onSuccess: (session, { groupId }) => {
			void qc.invalidateQueries({ queryKey: groupsKeys.sessions() });
			void qc.invalidateQueries({ queryKey: groupsKeys.sessionDetail(session.id) });
			const gid = groupId ?? session.groupId;
			if (gid) {
				void qc.invalidateQueries({ queryKey: groupsKeys.groupSessions(gid) });
			}
		},
	});
}
