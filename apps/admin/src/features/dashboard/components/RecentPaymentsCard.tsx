import { Wallet } from 'lucide-react';

import { EmptyState, Separator } from '@repo/ui';
import { formatPriceCompact, formatRelative } from '@repo/utils';

import { usePaymentList } from '@/features/billing/api/payments.queries';

import { PanelSkeleton } from './DashboardSkeletons';
import { PanelCard } from './PanelCard';
import { PanelError } from './PanelError';
import { useAppT } from '@/locales';

/** Title-case a payment method code (`BANK_TRANSFER` → `Bank transfer`). */
function methodLabel(method: string): string {
	const lower = method.replace(/_/g, ' ').toLowerCase();
	return lower.charAt(0).toUpperCase() + lower.slice(1);
}

/** Recent payments — reuses the payment list endpoint (SUCCEEDED, newest first). */
export function RecentPaymentsCard() {
	const t = useAppT('dashboard');
	const { data, isLoading, isError, refetch } = usePaymentList({
		status: 'SUCCEEDED',
		limit: 5,
	});

	if (isLoading) return <PanelSkeleton />;
	if (isError || !data)
		return <PanelError title={t('card.recentPayments')} onRetry={refetch} />;

	return (
		<PanelCard title={t('card.recentPayments')} flush>
			{data.rows.length === 0 ? (
				<EmptyState
					icon={<Wallet />}
					title={t('card.noPaymentsTitle')}
					description={t('card.noPaymentsDescription')}
				/>
			) : (
				<ul>
					{data.rows.map((payment, i) => (
						<li key={payment.id}>
							{i > 0 && <Separator />}
							<div className="flex items-center gap-4 px-5 py-3">
								<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-tone-green-bg text-tone-green-fg">
									<Wallet className="size-4" />
								</span>
								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium">
										{payment.studentName}
									</p>
									<p className="truncate text-xs text-muted-foreground">
										{methodLabel(payment.method)}
										{payment.paidAt
											? ` · ${formatRelative(payment.paidAt)}`
											: ''}
									</p>
								</div>
								<span className="shrink-0 text-sm font-semibold tabular-nums text-tone-green-fg">
									{formatPriceCompact(payment.amount)}
								</span>
							</div>
						</li>
					))}
				</ul>
			)}
		</PanelCard>
	);
}
