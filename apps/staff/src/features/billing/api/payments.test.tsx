import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';

import { server } from '@/test/server';
import { paymentHandlers } from '@/test/handlers';

import { usePayment, usePaymentList } from './payments.queries';

function wrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return function Wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
}

describe('usePaymentList', () => {
	it('fetches the payment list', async () => {
		const { result } = renderHook(() => usePaymentList({ page: 1, limit: 20 }), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.total).toBe(4);
		expect(result.current.data?.rows[0]?.studentName).toBe('Aziz Karimov');
	});

	it('filters by status', async () => {
		const { result } = renderHook(
			() => usePaymentList({ page: 1, limit: 20, status: 'FAILED' }),
			{ wrapper: wrapper() },
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.total).toBe(1);
		expect(result.current.data?.rows[0]?.id).toBe(304);
	});

	it('filters by method', async () => {
		const { result } = renderHook(
			() => usePaymentList({ page: 1, limit: 20, method: 'PAYME' }),
			{ wrapper: wrapper() },
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.total).toBe(2);
	});

	it('filters by student', async () => {
		const { result } = renderHook(
			() => usePaymentList({ page: 1, limit: 20, studentId: 1 }),
			{ wrapper: wrapper() },
		);

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.total).toBe(2);
	});

	it('renders an empty list', async () => {
		server.use(paymentHandlers.empty);
		const { result } = renderHook(() => usePaymentList({ page: 1, limit: 20 }), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.total).toBe(0);
		expect(result.current.data?.rows).toHaveLength(0);
	});

	it('surfaces an error when the request fails', async () => {
		server.use(paymentHandlers.serverError);
		const { result } = renderHook(() => usePaymentList({ page: 1, limit: 20 }), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isError).toBe(true));
	});
});

describe('usePayment', () => {
	it('fetches a payment detail, including the settled invoice number', async () => {
		const { result } = renderHook(() => usePayment(310), { wrapper: wrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.studentName).toBe('Aziz Karimov');
		expect(result.current.data?.invoiceId).toBe(101);
		expect(result.current.data?.invoiceNumber).toBe('INV-2026-0101');
	});

	it('surfaces a not-found error for an unknown payment', async () => {
		const { result } = renderHook(() => usePayment(999), { wrapper: wrapper() });

		await waitFor(() => expect(result.current.isError).toBe(true));
	});
});
