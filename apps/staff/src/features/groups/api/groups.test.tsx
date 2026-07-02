import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';

import { isApiError } from '@repo/api-client';

import { server } from '@/test/server';
import { groupHandlers } from '@/test/handlers';

import {
	useGroup,
	useGroupEnrollments,
	useGroupList,
	useGroupSessions,
} from './groups.queries';
import {
	useCreateGroup,
	useEnrollStudents,
	useUpdateEnrollment,
} from './groups.mutations';
import { useSession, useSessionCalendar } from './sessions.queries';
import { useUpdateSession } from './sessions.mutations';

function wrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return function Wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
}

describe('useGroupList', () => {
	it('fetches the group list', async () => {
		const { result } = renderHook(() => useGroupList({ page: 1, limit: 20 }), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.total).toBe(3);
		expect(result.current.data?.rows[0]?.name).toBe('IELTS Prep — Morning');
	});

	it('filters by status', async () => {
		const { result } = renderHook(
			() => useGroupList({ page: 1, limit: 20, status: 'ACTIVE' }),
			{ wrapper: wrapper() },
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.total).toBe(2);
		expect(result.current.data?.rows.every((g) => g.status === 'ACTIVE')).toBe(true);
	});

	it('surfaces an error when the request fails', async () => {
		server.use(groupHandlers.serverError);
		const { result } = renderHook(() => useGroupList({ page: 1, limit: 20 }), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isError).toBe(true));
	});
});

describe('useGroup', () => {
	it('fetches a group detail with counts', async () => {
		const { result } = renderHook(() => useGroup(10), { wrapper: wrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.id).toBe(10);
		expect(result.current.data?.activeEnrollmentsCount).toBe(2);
		expect(result.current.data?.scheduleRule?.days).toContain('MON');
	});

	it('surfaces a 404 for an unknown group', async () => {
		const { result } = renderHook(() => useGroup(999), { wrapper: wrapper() });
		await waitFor(() => expect(result.current.isError).toBe(true));
	});

	it('is disabled for a non-positive id', () => {
		const { result } = renderHook(() => useGroup(0), { wrapper: wrapper() });
		expect(result.current.fetchStatus).toBe('idle');
	});
});

describe('useCreateGroup', () => {
	it('creates a group and returns the detail shape', async () => {
		const { result } = renderHook(() => useCreateGroup(), { wrapper: wrapper() });

		const created = await result.current.mutateAsync({
			branchId: 1,
			courseId: 1,
			name: 'IELTS Weekend',
			scheduleRule: { days: ['SAT'], startTime: '10:00', endTime: '12:00' },
		});

		expect(created.id).toBe(99);
		expect(created.name).toBe('IELTS Weekend');
		expect(created.status).toBe('PLANNED');
	});

	it('rejects creation when the room is already booked (409)', async () => {
		server.use(groupHandlers.createConflict);
		const { result } = renderHook(() => useCreateGroup(), { wrapper: wrapper() });

		let error: unknown;
		try {
			await result.current.mutateAsync({
				branchId: 1,
				courseId: 1,
				roomId: 5,
				name: 'Clashing group',
				scheduleRule: { days: ['MON'], startTime: '09:00', endTime: '10:30' },
				startDate: '2025-03-03',
				endDate: '2025-03-14',
			});
		} catch (e) {
			error = e;
		}

		expect(isApiError(error)).toBe(true);
		expect(isApiError(error) && error.status).toBe(409);
		expect(isApiError(error) && error.code).toBe('GROUP_SCHEDULE_CONFLICT');
		expect(
			isApiError(error) &&
				(error.details?.conflicts as unknown[] | undefined)?.length,
		).toBe(1);
	});
});

describe('roster', () => {
	it('lists a group roster', async () => {
		const { result } = renderHook(() => useGroupEnrollments(10), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.length).toBe(2);
		expect(result.current.data?.[0]?.studentName).toBe('Aziz Karimov');
	});

	it('enrolls students', async () => {
		const { result } = renderHook(() => useEnrollStudents(), { wrapper: wrapper() });

		const created = await result.current.mutateAsync({
			groupId: 10,
			studentIds: [3],
		});
		expect(created).toHaveLength(1);
		expect(created[0]?.status).toBe('ACTIVE');
	});

	it('rejects enrollment when the group is at capacity (409)', async () => {
		server.use(groupHandlers.enrollFull);
		const { result } = renderHook(() => useEnrollStudents(), { wrapper: wrapper() });

		let error: unknown;
		try {
			await result.current.mutateAsync({ groupId: 10, studentIds: [3] });
		} catch (e) {
			error = e;
		}
		expect(isApiError(error)).toBe(true);
		expect(isApiError(error) && error.status).toBe(409);
	});

	it('drops a student with a reason', async () => {
		const { result } = renderHook(() => useUpdateEnrollment(), {
			wrapper: wrapper(),
		});

		const updated = await result.current.mutateAsync({
			id: 500,
			groupId: 10,
			status: 'DROPPED',
			dropReason: 'Transferred',
		});
		expect(updated.status).toBe('DROPPED');
	});
});

describe('sessions', () => {
	it('fetches the session calendar for a window', async () => {
		const { result } = renderHook(
			() => useSessionCalendar({ from: '2025-03-01', to: '2025-03-31' }),
			{ wrapper: wrapper() },
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.length).toBe(2);
	});

	it("lists a group's sessions", async () => {
		const { result } = renderHook(() => useGroupSessions(10), { wrapper: wrapper() });
		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.length).toBe(2);
	});

	it('fetches a session detail with roster', async () => {
		const { result } = renderHook(() => useSession(900), { wrapper: wrapper() });
		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.roster).toHaveLength(2);
	});

	it('reschedules a session', async () => {
		const { result } = renderHook(() => useUpdateSession(), { wrapper: wrapper() });

		const updated = await result.current.mutateAsync({
			id: 900,
			sessionDate: '2025-03-04',
			startTime: '11:00',
			endTime: '12:30',
		});
		expect(updated.sessionDate).toBe('2025-03-04');
	});

	it('surfaces a room double-booking conflict (409)', async () => {
		server.use(groupHandlers.sessionConflict);
		const { result } = renderHook(() => useUpdateSession(), { wrapper: wrapper() });

		let error: unknown;
		try {
			await result.current.mutateAsync({ id: 900, roomId: 2 });
		} catch (e) {
			error = e;
		}
		expect(isApiError(error)).toBe(true);
		expect(isApiError(error) && error.status).toBe(409);
	});
});
