import { useMutation, useQueryClient } from '@tanstack/react-query';

import { studentApi } from '@/api/apiClient';

import { inboxKeys } from './notifications.queries';
import type { StudentNotification } from './notifications.queries';

/**
 * Mark one notification read (`PATCH /student/notifications/:id/read`) — fired when the
 * detail screen opens an unread one. Refreshes the list, the detail entry and the bell's
 * unread count.
 */
export function useMarkRead() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (id: number) =>
			studentApi.patch<StudentNotification>(`/notifications/${id}/read`),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: inboxKeys.all });
		},
	});
}

/** Mark every unread notification read (`POST /student/notifications/read-all`). */
export function useMarkAllRead() {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => studentApi.post<void>('/notifications/read-all'),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: inboxKeys.all });
		},
	});
}
