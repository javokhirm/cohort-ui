import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';

import { server } from '@/test/server';
import { payrollHandlers } from '@/test/handlers';

import {
	usePayroll,
	usePayrollAdvances,
	usePayrollHistory,
	usePayrollPeriod,
	usePayrollStaffPeriod,
} from './payroll.queries';
import {
	useCreateAdvance,
	useFinalizePeriod,
	useMarkPayrollPaid,
	useRemoveAdvance,
	useUnfinalizePayroll,
} from './payroll.mutations';

const MONTH = '2026-07';

function wrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return function Wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
}

describe('usePayrollPeriod', () => {
	it('fetches the period view with its summary and rows', async () => {
		const { result } = renderHook(() => usePayrollPeriod(MONTH), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.month).toBe(MONTH);
		expect(result.current.data?.rows).toHaveLength(2);
		expect(result.current.data?.summary.totalNetPayable).toBe(8_400_000);
		expect(result.current.data?.periodStatus).toBe('PARTIALLY_FINALIZED');
	});

	it('surfaces live rows so the open month is distinguishable from snapshots', async () => {
		const { result } = renderHook(() => usePayrollPeriod(MONTH), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		const live = result.current.data?.rows.find((row) => row.status === 'LIVE');
		expect(live?.payrollId).toBeNull();
		expect(live?.rateType).toBe('PERCENT');
		expect(live?.advancesTotal).toBe(500_000);
	});

	it('filters rows by status without changing the period summary', async () => {
		const { result } = renderHook(() => usePayrollPeriod(MONTH, { status: 'LIVE' }), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.rows).toHaveLength(1);
		// The strip still reports the whole period.
		expect(result.current.data?.summary.staffCount).toBe(2);
	});

	it('reports staff excluded for want of a payroll config', async () => {
		const { result } = renderHook(() => usePayrollPeriod(MONTH), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.excludedCount).toBe(1);
	});

	it('surfaces an empty month', async () => {
		server.use(payrollHandlers.emptyPeriod);
		const { result } = renderHook(() => usePayrollPeriod(MONTH), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.rows).toHaveLength(0);
		expect(result.current.data?.periodStatus).toBe('OPEN');
	});

	it('surfaces a permission error', async () => {
		server.use(payrollHandlers.forbidden);
		const { result } = renderHook(() => usePayrollPeriod(MONTH), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isError).toBe(true));
	});

	it('stays idle without a month', () => {
		const { result } = renderHook(() => usePayrollPeriod(''), { wrapper: wrapper() });

		expect(result.current.fetchStatus).toBe('idle');
	});
});

describe('usePayrollStaffPeriod', () => {
	it('fetches the live detail with its per-student breakdown and advances', async () => {
		const { result } = renderHook(() => usePayrollStaffPeriod(MONTH, 1), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.status).toBe('LIVE');
		expect(result.current.data?.breakdown.lines).toHaveLength(2);
		expect(result.current.data?.breakdown.calculation.percent).toBe(50);
		expect(result.current.data?.advances).toHaveLength(1);
	});

	it('fetches a frozen snapshot with its finalize meta', async () => {
		const { result } = renderHook(() => usePayrollStaffPeriod(MONTH, 2), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.status).toBe('FINALIZED');
		expect(result.current.data?.finalizedByName).toBe('Aziz Yusupov');
		expect(result.current.data?.payrollId).toBe(10);
	});
});

describe('usePayrollHistory', () => {
	it('lists persisted snapshots for one staff member', async () => {
		const { result } = renderHook(() => usePayrollHistory({ staffId: 2 }), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.total).toBe(2);
		expect(result.current.data?.rows.every((row) => row.staffId === 2)).toBe(true);
	});

	it('surfaces an empty history', async () => {
		server.use(payrollHandlers.emptyHistory);
		const { result } = renderHook(() => usePayrollHistory({ staffId: 2 }), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.total).toBe(0);
	});
});

describe('usePayroll', () => {
	it('resolves a snapshot id to its staff-period view', async () => {
		const { result } = renderHook(() => usePayroll(10), { wrapper: wrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.staffId).toBe(2);
		expect(result.current.data?.month).toBe(MONTH);
	});
});

describe('usePayrollAdvances', () => {
	it('lists the advances of one staff member', async () => {
		const { result } = renderHook(() => usePayrollAdvances({ staffId: 1 }), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toHaveLength(1);
		expect(result.current.data?.[0]?.removable).toBe(true);
	});
});

describe('useFinalizePeriod', () => {
	it('reports what was finalized and what was already frozen', async () => {
		const { result } = renderHook(() => useFinalizePeriod(), { wrapper: wrapper() });

		const outcome = await result.current.mutateAsync({ month: MONTH });
		expect(outcome.finalized).toBe(1);
		expect(outcome.skipped).toBe(1);
	});

	it('surfaces a permission error', async () => {
		server.use(payrollHandlers.finalizeForbidden);
		const { result } = renderHook(() => useFinalizePeriod(), { wrapper: wrapper() });

		await expect(result.current.mutateAsync({ month: MONTH })).rejects.toBeDefined();
	});
});

describe('useMarkPayrollPaid', () => {
	it('settles a finalized snapshot', async () => {
		const { result } = renderHook(() => useMarkPayrollPaid(10), {
			wrapper: wrapper(),
		});

		const paid = await result.current.mutateAsync();
		expect(paid.status).toBe('PAID');
		expect(paid.paidAt).not.toBeNull();
	});
});

describe('useUnfinalizePayroll', () => {
	it('reopens a finalized snapshot', async () => {
		const { result } = renderHook(() => useUnfinalizePayroll(10), {
			wrapper: wrapper(),
		});

		await expect(result.current.mutateAsync()).resolves.toBeNull();
	});
});

describe('advance mutations', () => {
	it('records an advance', async () => {
		const { result } = renderHook(() => useCreateAdvance(), { wrapper: wrapper() });

		const advance = await result.current.mutateAsync({
			staffId: 1,
			branchId: 1,
			amount: 300_000,
			label: 'cash advance',
			advanceDate: '2026-07-20',
		});
		expect(advance.amount).toBe(300_000);
		expect(advance.payrollId).toBeNull();
	});

	it('refuses an advance once the month is finalized', async () => {
		server.use(payrollHandlers.advanceMonthFinalized);
		const { result } = renderHook(() => useCreateAdvance(), { wrapper: wrapper() });

		await expect(
			result.current.mutateAsync({
				staffId: 1,
				branchId: 1,
				amount: 300_000,
				advanceDate: '2026-07-20',
			}),
		).rejects.toBeDefined();
	});

	it('removes an unlinked advance', async () => {
		const { result } = renderHook(() => useRemoveAdvance(), { wrapper: wrapper() });

		await expect(result.current.mutateAsync(1)).resolves.toBeNull();
	});

	it('refuses to remove an advance already settled by a snapshot', async () => {
		server.use(payrollHandlers.advanceLinked);
		const { result } = renderHook(() => useRemoveAdvance(), { wrapper: wrapper() });

		await expect(result.current.mutateAsync(1)).rejects.toBeDefined();
	});
});
