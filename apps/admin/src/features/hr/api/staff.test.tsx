import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';

import { server } from '@/test/server';
import { staffHandlers } from '@/test/handlers';

import { useStaffList } from './staff.queries';
import { useCreateStaff } from './staff.mutations';

function wrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return function Wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
}

describe('useStaffList', () => {
	it('fetches the staff directory', async () => {
		const { result } = renderHook(() => useStaffList({ page: 1, limit: 20 }), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.total).toBe(3);
		expect(result.current.data?.rows[0]?.staffCode).toBe('STF-001');
	});

	it('filters by role', async () => {
		const { result } = renderHook(
			() => useStaffList({ page: 1, limit: 20, role: 'MANAGER' }),
			{ wrapper: wrapper() },
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.total).toBe(1);
		expect(result.current.data?.rows[0]?.roles).toContain('MANAGER');
	});

	it('filters by search term', async () => {
		const { result } = renderHook(
			() => useStaffList({ page: 1, limit: 20, search: 'nilufar' }),
			{ wrapper: wrapper() },
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.total).toBe(1);
		expect(result.current.data?.rows[0]?.user.firstName).toBe('Nilufar');
	});

	it('surfaces an error when the request fails', async () => {
		server.use(staffHandlers.serverError);
		const { result } = renderHook(() => useStaffList({ page: 1, limit: 20 }), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isError).toBe(true));
	});
});

describe('useCreateStaff', () => {
	it('creates a staff member', async () => {
		const { result } = renderHook(() => useCreateStaff(), { wrapper: wrapper() });

		const created = await result.current.mutateAsync({
			branchId: 1,
			firstName: 'Sardor',
			lastName: 'Aliyev',
			phone: '+998905556677',
			roleName: 'TEACHER',
			employmentType: 'FULL_TIME',
			specialization: ['Math'],
		});

		expect(created.id).toBe(99);
		expect(created.user.firstName).toBe('Sardor');
		expect(created.roles).toContain('TEACHER');
	});
});
