import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import { peopleKeys } from '@/features/people/api/keys';

import { invoicesKeys } from './keys';
import type {
	ClientSettableInvoiceLineItemType,
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
	/** Defaults to `TUITION` server-side when omitted. */
	type?: ClientSettableInvoiceLineItemType;
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

/** `POST /invoices/:id/apply-credit` response — mirrors `ApplyCreditResponseDto`. */
export interface ApplyCreditResult {
	applied: number;
	walletBalance: number;
	invoice: InvoiceDetail;
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

/**
 * Apply available wallet credit to an invoice (`POST /invoices/:id/apply-credit`,
 * no request body). Applying with a zero wallet balance is a harmless no-op
 * (`applied: 0`), not an error.
 */
export function useApplyWalletCredit() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: (invoiceId: number) =>
			manageApi.post<ApplyCreditResult>(`/invoices/${invoiceId}/apply-credit`),
		onSuccess: (data, invoiceId) => {
			void qc.invalidateQueries({ queryKey: invoicesKeys.invoices() });
			void qc.invalidateQueries({
				queryKey: invoicesKeys.invoiceDetail(invoiceId),
			});
			void qc.invalidateQueries({
				queryKey: peopleKeys.studentWallet(data.invoice.studentId),
			});
		},
	});
}
