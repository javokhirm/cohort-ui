import {
	keepPreviousData,
	useMutation,
	useQuery,
	useQueryClient,
} from '@tanstack/react-query';

import { dashboardKeys } from '@/api/dashboard/keys';
import { subscriptionInvoicesKeys } from '@/api/subscription-invoices/keys';
import { subscriptionPaymentsKeys } from '@/api/subscription-payments/keys';
import {
	getSubscriptionPayment,
	listSubscriptionPayments,
} from '@/api/subscription-payments/subscription-payments.queries';
import {
	recordOfflinePayment,
	refundSubscriptionPayment,
} from '@/api/subscription-payments/subscription-payments.mutations';
import type {
	RecordOfflinePaymentInput,
	RefundPaymentInput,
	SubscriptionPaymentListFilters,
} from '@/api/subscription-payments/types';

import { tenantsKeys } from '@/api/tenants/keys';

export function useSubscriptionPayments(filters: SubscriptionPaymentListFilters) {
	return useQuery({
		queryKey: subscriptionPaymentsKeys.list(filters),
		queryFn: () => listSubscriptionPayments(filters),
		placeholderData: keepPreviousData,
	});
}

export function useSubscriptionPayment(id: number | null) {
	return useQuery({
		queryKey: subscriptionPaymentsKeys.detail(id ?? 0),
		queryFn: () => getSubscriptionPayment(id as number),
		enabled: id != null,
	});
}

/**
 * Refund a payment. On success we invalidate the payment ledger, the invoice
 * ledger (the settled invoice may flip to REFUNDED), the affected tenant detail
 * and the dashboard (its billing counters shift). We never optimistically apply
 * a money mutation — the server's returned row is the truth.
 */
export function useRefundPayment(id: number, options?: { onSuccess?: () => void }) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: RefundPaymentInput) => refundSubscriptionPayment(id, input),
		onSuccess: (payment) => {
			void queryClient.invalidateQueries({
				queryKey: subscriptionPaymentsKeys.all,
			});
			void queryClient.invalidateQueries({
				queryKey: subscriptionInvoicesKeys.all,
			});
			void queryClient.invalidateQueries({
				queryKey: tenantsKeys.detail(payment.tenantId),
			});
			void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
			options?.onSuccess?.();
		},
	});
}

/**
 * Record an offline (bank transfer / cash) settlement for a tenant. On success
 * the period extends and access is restored, so we invalidate the tenant detail
 * alongside the payment/invoice ledgers and the dashboard.
 */
export function useRecordOfflinePayment(
	tenantId: number,
	options?: { onSuccess?: () => void },
) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: (input: RecordOfflinePaymentInput) =>
			recordOfflinePayment(tenantId, input),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: subscriptionPaymentsKeys.all,
			});
			void queryClient.invalidateQueries({
				queryKey: subscriptionInvoicesKeys.all,
			});
			void queryClient.invalidateQueries({
				queryKey: tenantsKeys.detail(tenantId),
			});
			void queryClient.invalidateQueries({ queryKey: dashboardKeys.all });
			options?.onSuccess?.();
		},
	});
}
