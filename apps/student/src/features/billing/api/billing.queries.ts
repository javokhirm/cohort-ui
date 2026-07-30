import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { studentApi } from '@/api/apiClient';

/** Statuses a student can ever see — `DRAFT`/`VOID` are excluded server-side. */
export type StudentInvoiceStatus = 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE';

export type StudentPaymentMethod =
	'CASH' | 'CLICK' | 'PAYME' | 'UZUM' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT';

/**
 * Billing header (`GET /student/billing/summary`, api-reference §5.8) — the outstanding
 * card and the wallet row. Hand-mirrored from the backend's `StudentBillingSummaryDto`.
 */
export interface StudentBillingSummary {
	outstanding: number;
	currency: string;
	/** Invoices with balance > 0. */
	openInvoiceCount: number;
	/** Of the open invoices, how many are OVERDUE. */
	overdueCount: number;
	oldestDueDate: string | null;
	oldestInvoiceId: number | null;
	walletBalance: number;
}

/** An invoice in the student's list (`GET /student/invoices`, §5.8). */
export interface StudentInvoice {
	id: number;
	invoiceNumber: string;
	status: StudentInvoiceStatus;
	total: number;
	amountPaid: number;
	/** total - amountPaid, never negative. */
	balance: number;
	currency: string;
	issueDate: string;
	dueDate: string;
}

/** Full invoice detail (`GET /student/invoices/:id`): line items, discounts, payments. */
export interface StudentInvoiceDetail extends StudentInvoice {
	lineItems: { description: string; amount: number }[];
	discounts: { name: string; appliedAmount: number }[];
	payments: {
		id: number;
		amount: number;
		method: StudentPaymentMethod;
		paidAt: string | null;
	}[];
}

/** One of the student's payments (`GET /student/payments`, §5.9). */
export interface StudentPayment {
	id: number;
	amount: number;
	currency: string;
	method: StudentPaymentMethod;
	status: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
	paidAt: string | null;
	/** null for advance/wallet-deposit payments. */
	invoiceId: number | null;
}

/** The credit wallet: balance + recent ledger movements (`GET /student/wallet`). */
export interface StudentWallet {
	currency: string;
	balance: number;
	transactions: {
		id: number;
		type:
			| 'DEPOSIT'
			| 'OVERPAYMENT'
			| 'REFUND_CREDIT'
			| 'INVOICE_APPLICATION'
			| 'ADJUSTMENT'
			| 'CASHOUT';
		/** Signed — negative for debits. */
		amount: number;
		notes: string | null;
		createdAt: string;
	}[];
}

/** "How to pay" contact details (`GET /student/billing/payment-instructions`, §5.8). */
export interface StudentPaymentInstructions {
	centerName: string;
	centerPhone: string | null;
	branchName: string;
	branchAddress: string | null;
	branchPhone: string | null;
}

const PAGE_SIZE = 20;

export const billingKeys = {
	all: ['billing'] as const,
	summary: () => [...billingKeys.all, 'summary'] as const,
	invoices: () => [...billingKeys.all, 'invoices'] as const,
	invoice: (id: number) => [...billingKeys.all, 'invoice', id] as const,
	payments: () => [...billingKeys.all, 'payments'] as const,
	wallet: () => [...billingKeys.all, 'wallet'] as const,
	instructions: () => [...billingKeys.all, 'instructions'] as const,
};

export function useBillingSummary() {
	return useQuery({
		queryKey: billingKeys.summary(),
		queryFn: () => studentApi.get<StudentBillingSummary>('/billing/summary'),
	});
}

/** The student's invoices, paginated (DRAFT/VOID are never returned). */
export function useInvoices(enabled = true) {
	return useInfiniteQuery({
		queryKey: billingKeys.invoices(),
		queryFn: ({ pageParam }) =>
			studentApi.getPaginated<StudentInvoice>('/invoices', {
				params: { page: pageParam, limit: PAGE_SIZE },
			}),
		initialPageParam: 1,
		getNextPageParam: (last) =>
			last.page < last.totalPages ? last.page + 1 : undefined,
		enabled,
	});
}

export function useInvoiceDetail(id: number) {
	return useQuery({
		queryKey: billingKeys.invoice(id),
		queryFn: () => studentApi.get<StudentInvoiceDetail>(`/invoices/${id}`),
		enabled: id > 0,
	});
}

/** The student's payment history, newest first. */
export function usePayments(enabled = true) {
	return useInfiniteQuery({
		queryKey: billingKeys.payments(),
		queryFn: ({ pageParam }) =>
			studentApi.getPaginated<StudentPayment>('/payments', {
				params: { page: pageParam, limit: PAGE_SIZE },
			}),
		initialPageParam: 1,
		getNextPageParam: (last) =>
			last.page < last.totalPages ? last.page + 1 : undefined,
		enabled,
	});
}

export function useWallet(enabled = true) {
	return useQuery({
		queryKey: billingKeys.wallet(),
		queryFn: () => studentApi.get<StudentWallet>('/wallet'),
		enabled,
	});
}

/** Fetched lazily — only when the "How to pay" sheet opens. */
export function usePaymentInstructions(enabled: boolean) {
	return useQuery({
		queryKey: billingKeys.instructions(),
		queryFn: () =>
			studentApi.get<StudentPaymentInstructions>('/billing/payment-instructions'),
		enabled,
	});
}
