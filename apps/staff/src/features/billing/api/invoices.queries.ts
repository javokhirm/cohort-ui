import { keepPreviousData, useQuery } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';
import { useActiveBranchIds } from '@/store/branchStore';
import type { PaginatedResult } from '@repo/api-client';

import {
	invoicesKeys,
	type InvoiceListFilters,
	type InvoiceSummaryFilters,
} from './keys';

// ─── Domain types ────────────────────────────────────────────────────────────
// Mirrors the backend invoice/payment surface (api-reference.md §3.13/§3.14),
// cross-checked against the actual response DTOs in educore-be
// (src/api/manage/dto/invoices/invoice-response.dto.ts and
// src/api/manage/dto/payments/payment-response.dto.ts) — the generated
// `@repo/api-client` OpenAPI types only expose the request DTOs, so these
// shapes are hand-declared; reconcile if the spec starts emitting response
// schemas.

export const INVOICE_STATUSES = [
	'DRAFT',
	'UNPAID',
	'PARTIAL',
	'PAID',
	'OVERDUE',
	'VOID',
] as const;
export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

/** Every method the backend can report on a payment (online methods are portal/webhook-only). */
export const PAYMENT_METHODS = [
	'CASH',
	'CLICK',
	'PAYME',
	'UZUM',
	'CARD',
	'BANK_TRANSFER',
] as const;
export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Methods `POST /invoices/:id/payments` accepts — online methods are Portal-only (api-reference.md §3.13). */
export const RECORDABLE_PAYMENT_METHODS = ['CASH', 'CARD', 'BANK_TRANSFER'] as const;
export type RecordablePaymentMethod = (typeof RECORDABLE_PAYMENT_METHODS)[number];

export const PAYMENT_STATUSES = ['PENDING', 'SUCCEEDED', 'FAILED', 'REFUNDED'] as const;
export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const INVOICE_LINE_ITEM_TYPES = [
	'TUITION',
	'LATE_FEE',
	'ADJUSTMENT',
	'PACKAGE',
] as const;
export type InvoiceLineItemType = (typeof INVOICE_LINE_ITEM_TYPES)[number];

export interface InvoiceLineItem {
	id: number;
	description: string;
	quantity: number;
	unitAmount: number;
	amount: number;
	/** `ADJUSTMENT`/`PACKAGE` aren't produced by any endpoint yet — render generically. */
	type: InvoiceLineItemType;
}

/** A discount as applied to an invoice — a reduced shape, not the full `DiscountResponse`. */
export interface InvoiceAppliedDiscount {
	id: number;
	discountId: number;
	name: string;
	appliedAmount: number;
}

/** A payment as summarized within invoice detail's `payments[]` — narrower than `PaymentResponse`. */
export interface InvoiceDetailPayment {
	id: number;
	amount: number;
	method: PaymentMethod;
	status: PaymentStatus;
	paidAt: string | null;
	providerTxnId: string | null;
}

/** The standalone payment resource (`POST /invoices/:id/payments`, `GET /payments`). */
export interface PaymentResponse {
	id: number;
	branchId: number;
	invoiceId: number | null;
	studentId: number;
	studentName: string;
	amount: number;
	currency: string;
	method: PaymentMethod;
	status: PaymentStatus;
	providerTxnId: string | null;
	paidAt: string | null;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
}

/** `GET /invoices` list row — no student name/line items/discounts/payments (detail-only, see `InvoiceDetail`). */
export interface InvoiceResponse {
	id: number;
	branchId: number;
	invoiceNumber: string;
	studentId: number;
	studentName: string;
	enrollmentId: number | null;
	feePlanId: number | null;
	periodStart: string | null;
	periodEnd: string | null;
	issueDate: string;
	dueDate: string;
	status: InvoiceStatus;
	subtotal: number;
	discountAmount: number;
	taxAmount: number;
	total: number;
	amountPaid: number;
	/** `max(0, total - amountPaid)`, computed server-side — never negative. */
	amountDue: number;
	currency: string;
	notes: string | null;
	createdAt: string;
	updatedAt: string;
}

/** `GET /invoices/summary` — true aggregate over every matching invoice (not just a page). */
export interface InvoiceSummaryResponse {
	currency: string;
	totalInvoiced: number;
	collected: number;
	outstanding: number;
}

/** `GET /invoices/:id` — the list shape plus student identity and sub-resources. */
export interface InvoiceDetail extends InvoiceResponse {
	studentName: string;
	studentCode: string;
	lineItems: InvoiceLineItem[];
	discounts: InvoiceAppliedDiscount[];
	payments: InvoiceDetailPayment[];
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useInvoiceList(filters: InvoiceListFilters) {
	// The global branch selection is part of the effective filters (and thus the
	// query key), so changing the selector refetches. An explicit caller value
	// still wins.
	const activeBranchIds = useActiveBranchIds();
	const effectiveFilters: InvoiceListFilters = {
		...filters,
		branchIds: filters.branchIds ?? activeBranchIds,
	};
	return useQuery({
		queryKey: invoicesKeys.invoiceList(effectiveFilters),
		queryFn: () =>
			manageApi.getPaginated<InvoiceResponse>('/invoices', {
				params: effectiveFilters,
			}) as Promise<PaginatedResult<InvoiceResponse>>,
		placeholderData: keepPreviousData,
	});
}

/**
 * Totals for the summary strip above the invoice list. Scoped to the active
 * branch selection like the list, but deliberately excludes the status tab
 * filter — the strip reports the whole picture regardless of which tab is
 * selected.
 */
export function useInvoiceSummary(filters: InvoiceSummaryFilters = {}) {
	const activeBranchIds = useActiveBranchIds();
	const effectiveFilters: InvoiceSummaryFilters = {
		...filters,
		branchIds: filters.branchIds ?? activeBranchIds,
	};
	return useQuery({
		queryKey: invoicesKeys.invoiceSummary(effectiveFilters),
		queryFn: () =>
			manageApi.get<InvoiceSummaryResponse>('/invoices/summary', {
				params: effectiveFilters,
			}),
		placeholderData: keepPreviousData,
	});
}

export function useInvoice(id: number) {
	return useQuery({
		queryKey: invoicesKeys.invoiceDetail(id),
		queryFn: () => manageApi.get<InvoiceDetail>(`/invoices/${id}`),
		enabled: id > 0,
	});
}
