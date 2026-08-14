import { superAdminApi } from '@/api/apiClient';
import type {
	RecordOfflinePaymentInput,
	RefundPaymentInput,
	SubscriptionPaymentView,
} from './types';

/**
 * Reverse a SUCCEEDED payment. **Money only** — the granted period is left in
 * place. Revoking access is the separate `POST /tenants/:id/cancel`.
 */
export function refundSubscriptionPayment(
	id: number,
	input: RefundPaymentInput,
): Promise<SubscriptionPaymentView> {
	return superAdminApi.post<SubscriptionPaymentView>(
		`/subscription-payments/${id}/refund`,
		input,
	);
}

/**
 * Offline settlement (`POST /tenants/:id/subscription/record-payment`) for a
 * center that paid by bank transfer or cash. On success the period extends and
 * access is restored immediately — the same path a gateway webhook takes.
 */
export function recordOfflinePayment(
	tenantId: number,
	input: RecordOfflinePaymentInput,
): Promise<SubscriptionPaymentView> {
	return superAdminApi.post<SubscriptionPaymentView>(
		`/tenants/${tenantId}/subscription/record-payment`,
		input,
	);
}
