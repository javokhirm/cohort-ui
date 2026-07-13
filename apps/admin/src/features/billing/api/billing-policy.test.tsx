import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';

import { isApiError } from '@repo/api-client';

import { server } from '@/test/server';
import { billingPolicyHandlers } from '@/test/handlers';

import { useBillingPolicy } from './billing-policy.queries';

function wrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return function Wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
}

// The policy is read-only on this surface — it is written from the internal
// platform (`PUT /super-admin/tenants/:id/billing-policy`), so there is no update
// hook here to test.
describe('useBillingPolicy', () => {
	it('fetches the effective tenant policy', async () => {
		const { result } = renderHook(() => useBillingPolicy(), { wrapper: wrapper() });

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data?.billingMode).toBe('PREPAID');
		expect(result.current.data?.chargeOnEnrollment).toBe(true);
		expect(result.current.data?.autoSuspendAfterDays).toBeNull();
	});

	it('surfaces a 403 when the caller lacks billing-policy.view', async () => {
		server.use(billingPolicyHandlers.forbidden);
		const { result } = renderHook(() => useBillingPolicy(), { wrapper: wrapper() });

		await waitFor(() => expect(result.current.isError).toBe(true));
		expect(isApiError(result.current.error) && result.current.error.status).toBe(403);
	});
});
