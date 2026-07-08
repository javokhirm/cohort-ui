import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';

import { useEnrollmentDiscounts } from './enrollment-discounts.queries';
import {
	useAssignEnrollmentDiscount,
	useRevokeEnrollmentDiscount,
} from './enrollment-discounts.mutations';

function wrapper() {
	const queryClient = new QueryClient({
		defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
	});
	return function Wrapper({ children }: { children: ReactNode }) {
		return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
	};
}

describe('useEnrollmentDiscounts', () => {
	it("lists an enrollment's standing assignments", async () => {
		const { result } = renderHook(() => useEnrollmentDiscounts(500), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toHaveLength(1);
		expect(result.current.data?.[0]?.discountName).toBe('Sibling discount');
		expect(result.current.data?.[0]?.validUntil).toBe('2026-12-31');
	});

	it('returns an empty list for an enrollment with no assignments', async () => {
		const { result } = renderHook(() => useEnrollmentDiscounts(999), {
			wrapper: wrapper(),
		});

		await waitFor(() => expect(result.current.isSuccess).toBe(true));
		expect(result.current.data).toHaveLength(0);
	});
});

describe('useAssignEnrollmentDiscount', () => {
	it('assigns a discount and resolves the discount definition fields', async () => {
		const { result } = renderHook(() => useAssignEnrollmentDiscount(), {
			wrapper: wrapper(),
		});

		const created = await result.current.mutateAsync({
			enrollmentId: 500,
			discountId: 2,
			validUntil: '2026-09-30',
		});

		expect(created.discountId).toBe(2);
		expect(created.discountName).toBe('Early payment');
		expect(created.discountType).toBe('PERCENTAGE');
		expect(created.validUntil).toBe('2026-09-30');
		expect(created.isActive).toBe(true);
	});

	it('rejects a duplicate assignment of the same discount', async () => {
		const { result } = renderHook(() => useAssignEnrollmentDiscount(), {
			wrapper: wrapper(),
		});

		// Discount 1 is already assigned to enrollment 500 in the fixtures.
		await expect(
			result.current.mutateAsync({ enrollmentId: 500, discountId: 1 }),
		).rejects.toBeTruthy();
	});
});

describe('useRevokeEnrollmentDiscount', () => {
	it('revokes an assignment', async () => {
		const { result } = renderHook(() => useRevokeEnrollmentDiscount(), {
			wrapper: wrapper(),
		});

		await expect(
			result.current.mutateAsync({ enrollmentId: 500, assignmentId: 900 }),
		).resolves.toBeNull();
	});
});
