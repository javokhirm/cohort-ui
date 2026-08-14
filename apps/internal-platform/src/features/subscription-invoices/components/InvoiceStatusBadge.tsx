import { StatusBadge } from '@repo/ui';

import type { SubscriptionInvoiceStatus } from '@/api/subscription-invoices/types';
import { useAppT } from '@/locales';

import { INVOICE_STATUS_TONE, invoiceStatusLabel } from '../constants';

export function InvoiceStatusBadge({ status }: { status: SubscriptionInvoiceStatus }) {
	const t = useAppT('invoices');
	return (
		<StatusBadge tone={INVOICE_STATUS_TONE[status]}>
			{invoiceStatusLabel(t, status)}
		</StatusBadge>
	);
}
