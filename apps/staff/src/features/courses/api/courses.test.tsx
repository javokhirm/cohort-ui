import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';

import { server } from '@/test/server';
import { courseHandlers } from '@/test/handlers';

import { useCourse, useCourseGroups, useCourseList } from './courses.queries';
import { useCreateCourse, useUpdateCourse } from './courses.mutations';

function wrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return function Wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
}

describe('useCourseList', () => {
	it('fetches the course catalog', async () => {
		const { result } = renderHook(() => useCourseList({ page: 1, limit: 20 }), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.total).toBe(3);
		expect(result.current.data?.rows[0]?.name).toBe('IELTS Prep');
		// Shared course carries a null branchId.
		expect(result.current.data?.rows[0]?.branchId).toBeNull();
	});

	it('filters by search term', async () => {
		const { result } = renderHook(
			() => useCourseList({ page: 1, limit: 20, search: 'ielts' }),
			{ wrapper: wrapper() },
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.total).toBe(1);
		expect(result.current.data?.rows[0]?.name).toBe('IELTS Prep');
	});

	it('filters by active state', async () => {
		const { result } = renderHook(
			() => useCourseList({ page: 1, limit: 20, isActive: false }),
			{ wrapper: wrapper() },
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.total).toBe(1);
		expect(result.current.data?.rows[0]?.isActive).toBe(false);
	});

	it('surfaces an error when the request fails', async () => {
		server.use(courseHandlers.serverError);
		const { result } = renderHook(() => useCourseList({ page: 1, limit: 20 }), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isError).toBe(true));
	});
});

describe('useCreateCourse', () => {
	it('creates a shared course (null branchId)', async () => {
		const { result } = renderHook(() => useCreateCourse(), { wrapper: wrapper() });

		const created = await result.current.mutateAsync({
			branchId: null,
			name: 'SAT Prep',
			level: 'Advanced',
			defaultDurationWeeks: 10,
			description: null,
		});

		expect(created.id).toBe(99);
		expect(created.name).toBe('SAT Prep');
		expect(created.branchId).toBeNull();
		expect(created.isActive).toBe(true);
	});
});

describe('useUpdateCourse', () => {
	it('retires a course via isActive', async () => {
		const { result } = renderHook(() => useUpdateCourse(), { wrapper: wrapper() });

		const updated = await result.current.mutateAsync({ id: 1, isActive: false });

		expect(updated.id).toBe(1);
		expect(updated.isActive).toBe(false);
	});
});

describe('useCourse', () => {
	it('fetches a single course by id', async () => {
		const { result } = renderHook(() => useCourse(1), { wrapper: wrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.id).toBe(1);
		expect(result.current.data?.name).toBe('IELTS Prep');
	});

	it('surfaces a 404 for an unknown course', async () => {
		const { result } = renderHook(() => useCourse(999), { wrapper: wrapper() });

		await waitFor(() => expect(result.current.isError).toBe(true));
	});

	it('is disabled for a non-positive id', () => {
		const { result } = renderHook(() => useCourse(0), { wrapper: wrapper() });

		expect(result.current.fetchStatus).toBe('idle');
	});
});

describe('useCourseGroups', () => {
	it('lists only the ACTIVE groups running the course', async () => {
		const { result } = renderHook(() => useCourseGroups(1), { wrapper: wrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		// MOCK has 3 groups for course 1, but one is COMPLETED → filtered out.
		expect(result.current.data?.total).toBe(2);
		expect(result.current.data?.rows.every((g) => g.status === 'ACTIVE')).toBe(true);
		expect(result.current.data?.rows[0]?.roomName).toBe('Room 204');
	});
});
