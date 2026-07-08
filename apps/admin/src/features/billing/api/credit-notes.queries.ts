import { useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { creditNotesKeys } from './keys';

/**
 * `GET|POST /invoices/:id/credit-notes` — mirrors `CreditNoteResponseDto`
 * (api-reference.md §3.13d). Generated OpenAPI types only expose the request
 * DTO, so this shape is hand-declared, matching the rest of this feature.
 */
export interface CreditNote {
	id: number;
	/** e.g. "CN-2026-00001". */
	creditNoteNumber: string;
	invoiceId: number;
	studentId: number;
	amount: number;
	reason: string;
	createdByUserId: number;
	createdAt: string;
}

export function useCreditNotes(invoiceId: number) {
	return useQuery({
		queryKey: creditNotesKeys.forInvoice(invoiceId),
		queryFn: () => manageApi.get<CreditNote[]>(`/invoices/${invoiceId}/credit-notes`),
		enabled: invoiceId > 0,
	});
}
