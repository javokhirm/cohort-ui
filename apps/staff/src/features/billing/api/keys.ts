export interface FeePlanListFilters {
	page?: number;
	limit?: number;
	branchIds?: number[];
	courseId?: number;
	isActive?: boolean;
}

export const feePlansKeys = {
	all: ['fee-plans'] as const,

	feePlans: () => [...feePlansKeys.all, 'fee-plan'] as const,
	feePlanList: (filters: FeePlanListFilters) =>
		[...feePlansKeys.feePlans(), 'list', filters] as const,
};

/** One billing policy per tenant — a singleton resource, so no filters/id. */
export const billingPolicyKeys = {
	all: ['billing-policy'] as const,
	detail: () => [...billingPolicyKeys.all, 'detail'] as const,
};

export interface DiscountListFilters {
	page?: number;
	limit?: number;
	isActive?: boolean;
	search?: string;
}

export const discountsKeys = {
	all: ['discounts'] as const,

	discounts: () => [...discountsKeys.all, 'discount'] as const,
	discountList: (filters: DiscountListFilters) =>
		[...discountsKeys.discounts(), 'list', filters] as const,
};

export const enrollmentDiscountsKeys = {
	all: ['enrollment-discounts'] as const,

	forEnrollment: (enrollmentId: number) =>
		[...enrollmentDiscountsKeys.all, enrollmentId] as const,
};

export const creditNotesKeys = {
	all: ['credit-notes'] as const,

	forInvoice: (invoiceId: number) => [...creditNotesKeys.all, invoiceId] as const,
};

export interface InvoiceListFilters {
	page?: number;
	limit?: number;
	branchIds?: number[];
	studentId?: number;
	status?: 'DRAFT' | 'UNPAID' | 'PARTIAL' | 'PAID' | 'OVERDUE' | 'VOID';
	from?: string;
	to?: string;
	dueBefore?: string;
}

/** `GET /invoices/summary` filters — the list filters, without pagination. */
export type InvoiceSummaryFilters = Omit<InvoiceListFilters, 'page' | 'limit'>;

export const invoicesKeys = {
	all: ['invoices'] as const,

	invoices: () => [...invoicesKeys.all, 'invoice'] as const,
	invoiceList: (filters: InvoiceListFilters) =>
		[...invoicesKeys.invoices(), 'list', filters] as const,
	invoiceSummary: (filters: InvoiceSummaryFilters) =>
		[...invoicesKeys.invoices(), 'summary', filters] as const,
	invoiceDetail: (id: number) => [...invoicesKeys.invoices(), 'detail', id] as const,
};

export interface PaymentListFilters {
	page?: number;
	limit?: number;
	branchIds?: number[];
	studentId?: number;
	invoiceId?: number;
	method?: 'CASH' | 'CLICK' | 'PAYME' | 'UZUM' | 'CARD' | 'BANK_TRANSFER' | 'CREDIT';
	status?: 'PENDING' | 'SUCCEEDED' | 'FAILED' | 'REFUNDED';
	from?: string;
	to?: string;
}

export const paymentsKeys = {
	all: ['payments'] as const,

	payments: () => [...paymentsKeys.all, 'payment'] as const,
	paymentList: (filters: PaymentListFilters) =>
		[...paymentsKeys.payments(), 'list', filters] as const,
	paymentDetail: (id: number) => [...paymentsKeys.payments(), 'detail', id] as const,
};
