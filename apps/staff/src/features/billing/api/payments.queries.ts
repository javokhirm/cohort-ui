import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import { useActiveBranchIds } from '@/store/branchStore';
import type { PaginatedResult } from '@repo/api-client';

import type { PaymentResponse } from './invoices.queries';
import { paymentsKeys, type PaymentListFilters } from './keys';

/** `GET /payments/:id` — the list shape plus the settled invoice's number, if any. */
export interface PaymentDetail extends PaymentResponse {
	invoiceNumber: string | null;
}

export function usePaymentList(filters: PaymentListFilters) {
	// The global branch selection is part of the effective filters (and thus the
	// query key), so changing the selector refetches. An explicit caller value
	// still wins.
	const activeBranchIds = useActiveBranchIds();
	const effectiveFilters: PaymentListFilters = {
		...filters,
		branchIds: filters.branchIds ?? activeBranchIds,
	};
	return useQuery({
		queryKey: paymentsKeys.paymentList(effectiveFilters),
		queryFn: () =>
			manageApi.getPaginated<PaymentResponse>('/payments', {
				params: effectiveFilters,
			}) as Promise<PaginatedResult<PaymentResponse>>,
		placeholderData: keepPreviousData,
	});
}

export function usePayment(id: number | null) {
	return useQuery({
		queryKey: paymentsKeys.paymentDetail(id ?? 0),
		queryFn: () => manageApi.get<PaymentDetail>(`/payments/${id}`),
		enabled: id != null && id > 0,
	});
}
