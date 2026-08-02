import { useInfiniteQuery } from '@tanstack/react-query';

import { studentApi } from '@/api/apiClient';

import type { StudentMark } from './marks.queries';

export type AttendanceStatus = 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';

/**
 * One class-log row (`GET /student/class-log`, api-reference §5.5) — an
 * attendance record plus that session's daily mark when one exists.
 *
 * `mark: null` means two different things, told apart by `status`:
 * `ABSENT`/`EXCUSED` never expected a mark, while `PRESENT`/`LATE` is a class
 * the teacher has not marked yet — the design's "Not marked". `note` is the
 * attendance note; the teacher's comment lives on `mark.comment`.
 */
export interface ClassLogEntry {
	/** The attendance record's id — the row identity, since a mark may not exist. */
	id: number;
	sessionId: number;
	sessionDate: string;
	groupId: number;
	groupName: string;
	topic: string | null;
	status: AttendanceStatus;
	note: string | null;
	mark: StudentMark | null;
}

/** The design's "Load 8 more" list, so pages are 8 rows and accumulate. */
export const CLASS_LOG_PAGE_SIZE = 8;

export const classLogKeys = {
	all: ['class-log'] as const,
	list: (groupId: number | undefined) =>
		[...classLogKeys.all, 'list', groupId] as const,
};

/** The class log, newest session first, narrowed to one group when filtered. */
export function useClassLog(groupId?: number) {
	return useInfiniteQuery({
		queryKey: classLogKeys.list(groupId),
		queryFn: ({ pageParam }) =>
			studentApi.getPaginated<ClassLogEntry>('/class-log', {
				params: { groupId, page: pageParam, limit: CLASS_LOG_PAGE_SIZE },
			}),
		initialPageParam: 1,
		getNextPageParam: (last) =>
			last.page < last.totalPages ? last.page + 1 : undefined,
	});
}
