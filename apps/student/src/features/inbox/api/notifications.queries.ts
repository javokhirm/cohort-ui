import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { studentApi } from '@/api/apiClient';

/** Categories the backend derives from the notification's template code (§5.10). */
export type NotificationCategory =
	'payment' | 'grade' | 'schedule' | 'absence' | 'notice';

/**
 * One row in the student's inbox (`GET /student/notifications`, api-reference §5.10).
 * `link` is a section token ("invoices" | "results" | "schedule" | "attendance"), not a
 * record id — the payload carries display variables only.
 */
export interface StudentNotification {
	id: number;
	category: NotificationCategory;
	title: string;
	body: string | null;
	sentAt: string | null;
	createdAt: string;
	isRead: boolean;
	link: string | null;
}

const PAGE_SIZE = 20;

export const inboxKeys = {
	all: ['notifications'] as const,
	list: () => [...inboxKeys.all, 'list'] as const,
	detail: (id: number) => [...inboxKeys.all, 'detail', id] as const,
	unreadCount: () => [...inboxKeys.all, 'unread-count'] as const,
};

/** The inbox, newest first, paginated. */
export function useNotifications() {
	return useInfiniteQuery({
		queryKey: inboxKeys.list(),
		queryFn: ({ pageParam }) =>
			studentApi.getPaginated<StudentNotification>('/notifications', {
				params: { page: pageParam, limit: PAGE_SIZE },
			}),
		initialPageParam: 1,
		getNextPageParam: (last) =>
			last.page < last.totalPages ? last.page + 1 : undefined,
	});
}

export function useNotification(id: number) {
	return useQuery({
		queryKey: inboxKeys.detail(id),
		queryFn: () => studentApi.get<StudentNotification>(`/notifications/${id}`),
		enabled: id > 0,
	});
}

/**
 * The unread total for the app bar's bell dot and the inbox header — a one-row unread
 * page read purely for its pagination total.
 */
export function useUnreadCount() {
	return useQuery({
		queryKey: inboxKeys.unreadCount(),
		queryFn: async () => {
			const page = await studentApi.getPaginated<StudentNotification>(
				'/notifications',
				{ params: { unread: true, limit: 1 } },
			);
			return page.total;
		},
	});
}
