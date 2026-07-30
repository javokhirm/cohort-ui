import { Card, Separator, StatusBadge } from '@repo/ui';
import { formatDate, formatMoney } from '@repo/utils';
import { useStatusLabel } from '@repo/i18n';

import type { StudentPayment } from '../api/billing.queries';
import { useAppT } from '@/locales';

interface PaymentListProps {
	payments: StudentPayment[];
}

/**
 * The Payments view per the design: one row per payment — a method chip, the amount
 * over "method · date", and the status badge.
 */
export function PaymentList({ payments }: PaymentListProps) {
	const t = useAppT('billing');
	const statusLabel = useStatusLabel();

	if (payments.length === 0) {
		return (
			<Card className="gap-0 py-0">
				<p className="px-4 py-8 text-center text-sm text-muted-foreground">
					{t('noPayments')}
				</p>
			</Card>
		);
	}

	return (
		<Card className="gap-0 overflow-hidden py-0">
			{payments.map((payment, i) => (
				<div key={payment.id}>
					{i > 0 && <Separator />}
					<div className="flex items-center gap-3 p-3.5">
						<span className="flex size-10 shrink-0 items-center justify-center rounded-[11px] bg-tone-indigo-bg text-[10px] font-bold text-tone-indigo-fg">
							{t(`methodShort.${payment.method}`)}
						</span>
						<div className="min-w-0 flex-1">
							<p className="text-sm font-bold tabular-nums text-foreground">
								{formatMoney(payment.amount, payment.currency)}
							</p>
							<p className="mt-px truncate text-[11.5px] text-muted-foreground">
								{t(`method.${payment.method}`)}
								{payment.paidAt ? ` · ${formatDate(payment.paidAt)}` : ''}
							</p>
						</div>
						<StatusBadge
							kind="payment"
							status={payment.status}
							className="shrink-0"
						>
							{statusLabel('payment', payment.status)}
						</StatusBadge>
					</div>
				</div>
			))}
		</Card>
	);
}
