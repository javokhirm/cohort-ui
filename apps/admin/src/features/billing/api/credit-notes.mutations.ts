import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import { peopleKeys } from '@/features/people/api/keys';

import { creditNotesKeys, invoicesKeys } from './keys';
import type { CreditNote } from './credit-notes.queries';

// ─── Input types ─────────────────────────────────────────────────────────────
// Mirrors the backend `CreateCreditNoteDto` (api-reference.md §3.13d).

export interface CreateCreditNoteInput {
	invoiceId: number;
	amount: number;
	reason: string;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

/**
 * Issue a credit note against an issued invoice (`POST /invoices/:id/credit-notes`).
 * Any excess beyond the invoice's new (lower) total is routed to the student's
 * wallet server-side as an `OVERPAYMENT`, so this also refreshes the wallet.
 */
export function useCreateCreditNote() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ invoiceId, ...body }: CreateCreditNoteInput) =>
			manageApi.post<CreditNote>(`/invoices/${invoiceId}/credit-notes`, body),
		onSuccess: (data, variables) => {
			void qc.invalidateQueries({
				queryKey: creditNotesKeys.forInvoice(variables.invoiceId),
			});
			void qc.invalidateQueries({ queryKey: invoicesKeys.invoices() });
			void qc.invalidateQueries({
				queryKey: invoicesKeys.invoiceDetail(variables.invoiceId),
			});
			void qc.invalidateQueries({
				queryKey: peopleKeys.studentWallet(data.studentId),
			});
		},
	});
}
