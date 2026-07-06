import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import { peopleKeys } from '@/features/people/api/keys';

import { invoicesKeys, paymentsKeys } from './keys';

// ─── Domain types ────────────────────────────────────────────────────────────
// Mirrors the backend `RefundPaymentDto` / `PaymentRefundResponseDto`
// (api-reference.md §3.14a).

export const REFUND_DESTINATIONS = ['WALLET', 'CASH_OUT'] as const;
export type RefundDestination = (typeof REFUND_DESTINATIONS)[number];

/** Note: unlike credit notes, this response does not carry `studentId`. */
export interface PaymentRefundResult {
	id: number;
	paymentId: number;
	invoiceId: number | null;
	amount: number;
	destination: RefundDestination;
	creditTransactionId: number | null;
	notes: string | null;
	createdByUserId: number;
	createdAt: string;
}

// ─── Input types ─────────────────────────────────────────────────────────────

export interface RefundPaymentInput {
	paymentId: number;
	amount: number;
	destination: RefundDestination;
	notes?: string | null;
	/** Not sent to the server — only used to target cache invalidation below. */
	invoiceId: number | null;
	/** Not sent to the server — the response doesn't carry it, so the caller must. */
	studentId: number;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Refund a payment (`POST /payments/:id/refund`), never optimistic — money-
 * critical. A refund can re-open the linked invoice (its `amountPaid` drops
 * and status recalculates), and — regardless of `destination` — can affect
 * the wallet ledger: a `WALLET`-destined refund credits it, and a `CASH_OUT`
 * refund of a wallet-deposit payment still debits it. So the wallet query is
 * always invalidated, not just when `destination === 'WALLET'`.
 */
export function useRefundPayment() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: RefundPaymentInput) =>
			manageApi.post<PaymentRefundResult>(`/payments/${input.paymentId}/refund`, {
				amount: input.amount,
				destination: input.destination,
				notes: input.notes,
			}),
		onSuccess: (_data, variables) => {
			void qc.invalidateQueries({ queryKey: paymentsKeys.payments() });
			void qc.invalidateQueries({
				queryKey: paymentsKeys.paymentDetail(variables.paymentId),
			});
			if (variables.invoiceId != null) {
				void qc.invalidateQueries({ queryKey: invoicesKeys.invoices() });
				void qc.invalidateQueries({
					queryKey: invoicesKeys.invoiceDetail(variables.invoiceId),
				});
			}
			void qc.invalidateQueries({
				queryKey: peopleKeys.studentWallet(variables.studentId),
			});
		},
	});
}
