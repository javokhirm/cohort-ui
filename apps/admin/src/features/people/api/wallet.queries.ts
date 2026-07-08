import { useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { peopleKeys } from './keys';

// ─── Domain types ────────────────────────────────────────────────────────────
// Mirrors the backend credit-wallet surface (api-reference.md §3.13c), cross-
// checked against `WalletResponseDto` — the generated OpenAPI types only expose
// request DTOs (no `@ApiResponse({type})` on these controllers), so this shape
// is hand-declared, same as the billing invoice/payment types.

export const WALLET_TRANSACTION_TYPES = [
	'DEPOSIT',
	'OVERPAYMENT',
	'REFUND_CREDIT',
	'INVOICE_APPLICATION',
	'ADJUSTMENT',
	'CASHOUT',
] as const;
export type WalletTransactionType = (typeof WALLET_TRANSACTION_TYPES)[number];

export interface WalletTransaction {
	id: number;
	type: WalletTransactionType;
	/** Signed — positive is a credit, negative a debit. */
	amount: number;
	invoiceId: number | null;
	paymentId: number | null;
	creditNoteId: number | null;
	notes: string | null;
	createdAt: string;
}

/**
 * `GET /students/:id/wallet`. Note: the backend caps this at the 100 most
 * recent transactions — no pagination, no total count. Don't build a "load
 * more" control against it.
 */
export interface Wallet {
	studentId: number;
	currency: string;
	balance: number;
	transactions: WalletTransaction[];
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useStudentWallet(studentId: number) {
	return useQuery({
		queryKey: peopleKeys.studentWallet(studentId),
		queryFn: () => manageApi.get<Wallet>(`/students/${studentId}/wallet`),
		enabled: studentId > 0,
	});
}
