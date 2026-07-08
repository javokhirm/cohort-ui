import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';

import { server } from '@/test/server';
import { feePlanHandlers } from '@/test/handlers';

import { useFeePlanList } from './fee-plans.queries';
import { useCreateFeePlan, useUpdateFeePlan } from './fee-plans.mutations';

function wrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return function Wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
}

describe('useFeePlanList', () => {
	it('fetches the fee plan directory', async () => {
		const { result } = renderHook(() => useFeePlanList({ page: 1, limit: 20 }), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.total).toBe(4);
		expect(result.current.data?.rows[0]?.name).toBe('Monthly Tuition — IELTS');
		// Shared plan carries a null branchId.
		expect(result.current.data?.rows[0]?.branchId).toBeNull();
	});

	it('filters by active state', async () => {
		const { result } = renderHook(
			() => useFeePlanList({ page: 1, limit: 20, isActive: false }),
			{ wrapper: wrapper() },
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.total).toBe(1);
		expect(result.current.data?.rows[0]?.isActive).toBe(false);
	});

	it('filters by course', async () => {
		const { result } = renderHook(
			() => useFeePlanList({ page: 1, limit: 20, courseId: 2 }),
			{ wrapper: wrapper() },
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.total).toBe(1);
		expect(result.current.data?.rows[0]?.name).toBe(
			'Monthly Tuition — General English',
		);
	});

	it('renders an empty directory', async () => {
		server.use(feePlanHandlers.empty);
		const { result } = renderHook(() => useFeePlanList({ page: 1, limit: 20 }), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.total).toBe(0);
		expect(result.current.data?.rows).toHaveLength(0);
	});

	it('surfaces an error when the request fails', async () => {
		server.use(feePlanHandlers.serverError);
		const { result } = renderHook(() => useFeePlanList({ page: 1, limit: 20 }), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isError).toBe(true));
	});
});

describe('useCreateFeePlan', () => {
	it('creates a shared fee plan (null branchId, null courseId)', async () => {
		const { result } = renderHook(() => useCreateFeePlan(), { wrapper: wrapper() });

		const created = await result.current.mutateAsync({
			branchId: null,
			courseId: null,
			name: 'SAT Prep — Monthly',
			amount: 3_600_000,
			billingCycle: 'MONTHLY',
			dueDay: 5,
			prorationMethod: 'DAILY',
		});

		expect(created.id).toBe(99);
		expect(created.name).toBe('SAT Prep — Monthly');
		expect(created.amount).toBe(3_600_000);
		expect(created.billingCycle).toBe('MONTHLY');
		expect(created.branchId).toBeNull();
		expect(created.isActive).toBe(true);
	});

	it('creates a plan that inherits the tenant policy (null overrides)', async () => {
		const { result } = renderHook(() => useCreateFeePlan(), { wrapper: wrapper() });

		const created = await result.current.mutateAsync({
			branchId: null,
			courseId: null,
			name: 'Inheriting plan',
			amount: 500_000,
			billingCycle: 'MONTHLY',
			dueDay: null,
			prorationMethod: null,
		});

		expect(created.dueDay).toBeNull();
		expect(created.prorationMethod).toBeNull();
	});
});

describe('useUpdateFeePlan', () => {
	it('retires a fee plan via isActive', async () => {
		const { result } = renderHook(() => useUpdateFeePlan(), { wrapper: wrapper() });

		const updated = await result.current.mutateAsync({ id: 1, isActive: false });

		expect(updated.id).toBe(1);
		expect(updated.isActive).toBe(false);
	});

	it('updates the amount and clears the due-day override', async () => {
		const { result } = renderHook(() => useUpdateFeePlan(), { wrapper: wrapper() });

		const updated = await result.current.mutateAsync({
			id: 2,
			amount: 700_000,
			dueDay: null,
		});

		expect(updated.amount).toBe(700_000);
		expect(updated.dueDay).toBeNull();
	});
});
