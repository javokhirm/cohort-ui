import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';

import { server } from '@/test/server';
import { payrollHandlers } from '@/test/handlers';

import { usePayrollList } from './payroll.queries';
import {
	useApprovePayroll,
	useMarkPayrollPaid,
	useRunPayroll,
} from './payroll.mutations';

function wrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return function Wrapper({ children }: { children: ReactNode }) {
		return (
			<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
		);
	};
}

describe('usePayrollList', () => {
	it('fetches all payroll records', async () => {
		const { result } = renderHook(() => usePayrollList({ page: 1, limit: 20 }), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.total).toBe(3);
	});

	it('filters by status', async () => {
		const { result } = renderHook(
			() => usePayrollList({ page: 1, limit: 20, status: 'DRAFT' }),
			{ wrapper: wrapper() },
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.total).toBe(1);
		expect(result.current.data?.rows[0]?.status).toBe('DRAFT');
	});

	it('filters by staffId (payslips for one staff member)', async () => {
		const { result } = renderHook(
			() => usePayrollList({ page: 1, limit: 20, staffId: 3 }),
			{ wrapper: wrapper() },
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.rows.every((p) => p.staffId === 3)).toBe(true);
	});

	it('surfaces empty results', async () => {
		server.use(payrollHandlers.empty);
		const { result } = renderHook(() => usePayrollList({ page: 1, limit: 20 }), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.rows).toHaveLength(0);
	});
});

describe('payroll workflow mutations', () => {
	it('approves a draft payroll (DRAFT → APPROVED)', async () => {
		const { result } = renderHook(() => useApprovePayroll(), { wrapper: wrapper() });

		const approved = await result.current.mutateAsync(1);
		expect(approved.status).toBe('APPROVED');
		expect(approved.approvedByUserId).toBe(1);
	});

	it('marks an approved payroll as paid (APPROVED → PAID)', async () => {
		const { result } = renderHook(() => useMarkPayrollPaid(), { wrapper: wrapper() });

		const paid = await result.current.mutateAsync(2);
		expect(paid.status).toBe('PAID');
		expect(paid.paidAt).not.toBeNull();
	});

	it('runs payroll and reports created draft count', async () => {
		const { result } = renderHook(() => useRunPayroll(), { wrapper: wrapper() });

		const run = await result.current.mutateAsync({
			periodStart: '2026-07-01',
			periodEnd: '2026-07-31',
			autoCalculate: true,
		});

		expect(run.created).toBe(3);
		expect(run.payrolls.every((p) => p.status === 'DRAFT')).toBe(true);
	});
});
