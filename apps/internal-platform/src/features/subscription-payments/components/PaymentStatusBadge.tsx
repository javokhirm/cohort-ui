import { StatusBadge } from '@repo/ui';

import type { SubscriptionPaymentStatus } from '@/api/subscription-payments/types';
import { useAppT } from '@/locales';

import { PAYMENT_STATUS_TONE, paymentStatusLabel } from '../constants';

export function PaymentStatusBadge({ status }: { status: SubscriptionPaymentStatus }) {
	const t = useAppT('payments');
	return (
		<StatusBadge tone={PAYMENT_STATUS_TONE[status]}>
			{paymentStatusLabel(t, status)}
		</StatusBadge>
	);
}
