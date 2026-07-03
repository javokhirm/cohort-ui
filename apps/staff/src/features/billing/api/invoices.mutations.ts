import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { invoicesKeys } from './keys';
import type {
	InvoiceDetail,
	InvoiceResponse,
	PaymentResponse,
	RecordablePaymentMethod,
} from './invoices.queries';

// ─── Input types ─────────────────────────────────────────────────────────────
// Mirror the backend `CreateInvoiceDto` / `UpdateInvoiceDto` / `RecordPaymentDto` /
// `ApplyDiscountDto` (api-reference.md §3.13).

export interface CreateInvoiceLineItemInput {
	description: string;
	quantity: number;
	unitAmount: number;
}

export interface CreateInvoiceInput {
	branchId: number;
	studentId: number;
	enrollmentId?: number | null;
	feePlanId?: number | null;
	periodStart?: string | null;
	periodEnd?: string | null;
	dueDate: string;
	lineItems?: CreateInvoiceLineItemInput[];
	notes?: string | null;
}

export interface UpdateInvoiceInput {
	id: number;
	dueDate?: string;
	notes?: string | null;
	/** Allowed transitions: `DRAFT` → `UNPAID`, any → `VOID`. */
	status?: 'UNPAID' | 'VOID';
}

export interface RecordPaymentInput {
	invoiceId: number;
	amount: number;
	method: RecordablePaymentMethod;
	paidAt?: string;
	notes?: string | null;
}

export interface ApplyDiscountInput {
	invoiceId: number;
	discountId: number;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateInvoice() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (input: CreateInvoiceInput) =>
			manageApi.post<InvoiceDetail>('/invoices', input),
		onSuccess: () => {
			void qc.invalidateQueries({ queryKey: invoicesKeys.invoices() });
		},
	});
}

export function useUpdateInvoice() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ id, ...body }: UpdateInvoiceInput) =>
			manageApi.patch<InvoiceDetail>(`/invoices/${id}`, body),
		onSuccess: (_data, { id }) => {
			void qc.invalidateQueries({ queryKey: invoicesKeys.invoices() });
			void qc.invalidateQueries({ queryKey: invoicesKeys.invoiceDetail(id) });
		},
	});
}

/** Record a manual payment (`POST /invoices/:id/payments`) — never optimistic, money-critical. */
export function useRecordPayment() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ invoiceId, ...body }: RecordPaymentInput) =>
			manageApi.post<PaymentResponse>(`/invoices/${invoiceId}/payments`, body),
		onSuccess: (_data, { invoiceId }) => {
			void qc.invalidateQueries({ queryKey: invoicesKeys.invoices() });
			void qc.invalidateQueries({
				queryKey: invoicesKeys.invoiceDetail(invoiceId),
			});
		},
	});
}

export function useApplyDiscount() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ invoiceId, discountId }: ApplyDiscountInput) =>
			manageApi.post<InvoiceResponse>(`/invoices/${invoiceId}/discounts`, {
				discountId,
			}),
		onSuccess: (_data, { invoiceId }) => {
			void qc.invalidateQueries({ queryKey: invoicesKeys.invoices() });
			void qc.invalidateQueries({
				queryKey: invoicesKeys.invoiceDetail(invoiceId),
			});
		},
	});
}
