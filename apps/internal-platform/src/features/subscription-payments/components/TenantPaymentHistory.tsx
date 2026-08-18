import { useState } from 'react';
import { Link } from '@tanstack/react-router';

import { Card, CardContent, CardHeader, CardTitle, Separator, Skeleton } from '@repo/ui';

import { formatDate, formatPrice } from '@repo/utils';
import type { SubscriptionPaymentView } from '@/api/subscription-payments/types';
import { useAppT } from '@/locales';

import { paymentMethodLabel } from '../constants';
import { useSubscriptionPayments } from '../hooks';
import { PaymentDetailSheet } from './PaymentDetailSheet';
import { PaymentStatusBadge } from './PaymentStatusBadge';

const PREVIEW_LIMIT = 5;

/**
 * A tenant's payment history — the tenant→platform settlements for one center,
 * newest first. Rows open the payment detail (where a SUCCEEDED payment can be
 * refunded).
 */
export function TenantPaymentHistory({ tenantId }: { tenantId: number }) {
	const t = useAppT('payments');
	const [selectedId, setSelectedId] = useState<number | null>(null);
	const [sheetOpen, setSheetOpen] = useState(false);

	const { data, isLoading, isError } = useSubscriptionPayments({
		tenantId,
		page: 1,
		limit: PREVIEW_LIMIT,
	});
	const payments = data?.rows ?? [];

	function openDetail(payment: SubscriptionPaymentView) {
		setSelectedId(payment.id);
		setSheetOpen(true);
	}

	return (
		<Card className="gap-0 py-0">
			<CardHeader className="flex flex-row items-center justify-between border-b border-border px-5 py-4">
				<CardTitle className="text-sm font-semibold">
					{t('paymentHistory')}
				</CardTitle>
				{(data?.total ?? 0) > 0 && (
					<Link
						to="/subscription-payments"
						search={{ tenantId }}
						className="text-xs text-primary underline-offset-4 hover:underline"
					>
						{t('viewAll', { count: data?.total ?? 0 })}
					</Link>
				)}
			</CardHeader>
			<CardContent className="px-0 py-0">
				{isLoading ? (
					<div className="flex flex-col gap-2 p-4">
						<Skeleton className="h-10 w-full" />
						<Skeleton className="h-10 w-full" />
					</div>
				) : isError ? (
					<p className="py-8 text-center text-sm text-destructive">
						{t('loadError')}
					</p>
				) : payments.length === 0 ? (
					<p className="py-8 text-center text-sm text-muted-foreground">
						{t('emptyForTenant')}
					</p>
				) : (
					<ul>
						{payments.map((payment, i) => (
							<li key={payment.id}>
								{i > 0 && <Separator />}
								<button
									type="button"
									onClick={() => openDetail(payment)}
									className="flex w-full cursor-pointer items-center gap-3 px-5 py-3 text-left transition-colors hover:bg-muted/40"
								>
									<div className="flex min-w-0 flex-1 flex-col">
										<span className="truncate text-sm font-medium">
											{paymentMethodLabel(t, payment.method)}
										</span>
										<span className="truncate text-xs text-muted-foreground">
											{payment.invoiceCode ?? '—'} ·{' '}
											{formatDate(payment.createdAt)}
										</span>
									</div>
									<span className="text-sm font-medium tabular-nums">
										{formatPrice(payment.amount)} {payment.currency}
									</span>
									<PaymentStatusBadge status={payment.status} />
								</button>
							</li>
						))}
					</ul>
				)}
			</CardContent>

			<PaymentDetailSheet
				paymentId={selectedId}
				open={sheetOpen}
				onOpenChange={setSheetOpen}
			/>
		</Card>
	);
}
