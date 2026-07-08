import { InvoiceDetailPage } from '@/features/billing';

interface InvoiceDetailRouteProps {
	id: string;
}

export function InvoiceDetailRoute({ id }: InvoiceDetailRouteProps) {
	const invoiceId = Number(id);
	return <InvoiceDetailPage invoiceId={invoiceId} />;
}
