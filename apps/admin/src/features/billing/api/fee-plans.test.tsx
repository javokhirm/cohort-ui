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

	it('exposes groupCount — the live groups billing on each plan', async () => {
		const { result } = renderHook(() => useFeePlanList({ page: 1, limit: 20 }), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		const byId = new Map(result.current.data?.rows.map((p) => [p.id, p.groupCount]));
		expect(byId.get(1)).toBe(2);
		expect(byId.get(3)).toBe(0);
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
	it('creates a shared fee plan (null branchId)', async () => {
		const { result } = renderHook(() => useCreateFeePlan(), { wrapper: wrapper() });

		const created = await result.current.mutateAsync({
			branchId: null,
			name: 'SAT Prep — Monthly',
			amount: 3_600_000,
			billingCycle: 'MONTHLY',
		});

		expect(created.id).toBe(99);
		expect(created.name).toBe('SAT Prep — Monthly');
		expect(created.amount).toBe(3_600_000);
		expect(created.billingCycle).toBe('MONTHLY');
		expect(created.branchId).toBeNull();
		expect(created.isActive).toBe(true);
	});

	it('carries no billing terms — those come from the tenant policy', async () => {
		const { result } = renderHook(() => useCreateFeePlan(), { wrapper: wrapper() });

		const created = await result.current.mutateAsync({
			branchId: null,
			name: 'Policy-governed plan',
			amount: 500_000,
			billingCycle: 'MONTHLY',
		});

		// A plan once carried nullable dueDay/prorationMethod overrides of the
		// billing policy. They are gone: a plan says only WHAT to charge.
		expect(created).not.toHaveProperty('dueDay');
		expect(created).not.toHaveProperty('prorationMethod');
	});
});

describe('useUpdateFeePlan', () => {
	it('retires a fee plan no group bills on', async () => {
		const { result } = renderHook(() => useUpdateFeePlan(), { wrapper: wrapper() });

		// Plan 3 has groupCount 0 — nothing is billing on it.
		const updated = await result.current.mutateAsync({ id: 3, isActive: false });

		expect(updated.id).toBe(3);
		expect(updated.isActive).toBe(false);
	});

	it('refuses to retire a plan a live course still uses (409)', async () => {
		const { result } = renderHook(() => useUpdateFeePlan(), { wrapper: wrapper() });

		// Plan 1 backs two groups; retiring it would silently stop billing them.
		await expect(
			result.current.mutateAsync({ id: 1, isActive: false }),
		).rejects.toMatchObject({ code: 'FEE_PLAN_IN_USE' });
	});

	it('updates the amount', async () => {
		const { result } = renderHook(() => useUpdateFeePlan(), { wrapper: wrapper() });

		const updated = await result.current.mutateAsync({ id: 2, amount: 700_000 });

		expect(updated.amount).toBe(700_000);
	});
});
