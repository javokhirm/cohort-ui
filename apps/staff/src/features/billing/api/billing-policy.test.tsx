import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';

import { isApiError } from '@repo/api-client';

import { server } from '@/test/server';
import { billingPolicyHandlers } from '@/test/handlers';

import { useBillingPolicy } from './billing-policy.queries';
import { useUpdateBillingPolicy } from './billing-policy.mutations';

function wrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return function Wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
}

describe('useBillingPolicy', () => {
	it('fetches the effective tenant policy', async () => {
		const { result } = renderHook(() => useBillingPolicy(), { wrapper: wrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.billingMode).toBe('PREPAID');
		expect(result.current.data?.chargeOnEnrollment).toBe(true);
		expect(result.current.data?.autoSuspendAfterDays).toBeNull();
	});

	it('surfaces a 403 for a non-owner', async () => {
		server.use(billingPolicyHandlers.forbidden);
		const { result } = renderHook(() => useBillingPolicy(), { wrapper: wrapper() });

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(isApiError(result.current.error) && result.current.error.status).toBe(403);
	});
});

describe('useUpdateBillingPolicy', () => {
	it('merge-updates the policy and echoes the sent fields', async () => {
		const { result } = renderHook(() => useUpdateBillingPolicy(), {
			wrapper: wrapper(),
		});

		const updated = await result.current.mutateAsync({
			dueDay: 10,
			graceDays: 14,
			chargeOnEnrollment: false,
		});

		expect(updated.dueDay).toBe(10);
		expect(updated.graceDays).toBe(14);
		expect(updated.chargeOnEnrollment).toBe(false);
		// Untouched fields keep their stored values (merge-upsert).
		expect(updated.billingDay).toBe(1);
	});

	it('accepts POSTPAID as a settable billing mode', async () => {
		const { result } = renderHook(() => useUpdateBillingPolicy(), {
			wrapper: wrapper(),
		});

		const updated = await result.current.mutateAsync({ billingMode: 'POSTPAID' });

		expect(updated.billingMode).toBe('POSTPAID');
	});

	it('rejects a percentage late fee above 100 (422)', async () => {
		const { result } = renderHook(() => useUpdateBillingPolicy(), {
			wrapper: wrapper(),
		});

		const error = await result.current
			.mutateAsync({
				lateFeeEnabled: true,
				lateFeeType: 'PERCENT',
				lateFeeAmount: 150,
			})
			.catch((e: unknown) => e);

		expect(isApiError(error) && error.status).toBe(422);
		expect(isApiError(error) && error.code).toBe('BILLING_POLICY_INVALID_LATE_FEE');
	});

	it('rejects auto-cancel days not exceeding auto-suspend days (422)', async () => {
		const { result } = renderHook(() => useUpdateBillingPolicy(), {
			wrapper: wrapper(),
		});

		const error = await result.current
			.mutateAsync({
				autoSuspendAfterDays: 14,
				autoCancelAfterDays: 7,
			})
			.catch((e: unknown) => e);

		expect(isApiError(error) && error.status).toBe(422);
		expect(isApiError(error) && error.code).toBe(
			'BILLING_POLICY_INVALID_DUNNING_DAYS',
		);
	});
});
