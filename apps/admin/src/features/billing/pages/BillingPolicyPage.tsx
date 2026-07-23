import { Lock } from 'lucide-react';

import { Card, CardHeader, CardTitle, PageHeader, Spinner } from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { useAppT } from '@/locales';

import { useBillingPolicy } from '../api/billing-policy.queries';
import { BillingPolicySummary } from '../components/BillingPolicySummary';

/**
 * The tenant's billing policy, read-only. It decides when every invoice this
 * center issues is generated, when it falls due, and when unpaid enrollments are
 * auto-suspended — crucial configuration that should rarely change — so it is
 * configured by the platform team, not from here. Staff can still read it, since
 * invoice generation branches on the billing mode and cycle anchor.
 */
export function BillingPolicyPage() {
	const t = useAppT('billing');
	const { data: policy, isLoading, isError, error } = useBillingPolicy();

	const isForbidden = isApiError(error) && error.status === 403;

	return (
		<div className="mx-auto flex max-w-3xl flex-col gap-6">
			<PageHeader
				title={t('policySections.pageTitle')}
				description={t('policySections.pageDescription')}
			/>

			<Card>
				<CardHeader className="flex flex-row items-start gap-3 space-y-0">
					<span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
						<Lock className="size-4" />
					</span>
					<div className="flex flex-col gap-1">
						<CardTitle className="text-sm font-semibold">
							{t('misc.managedByCohort')}
						</CardTitle>
						<p className="text-sm font-normal text-muted-foreground">
							{t('policyPage.managedDescription')}
						</p>
					</div>
				</CardHeader>
			</Card>

			{isLoading && (
				<div className="flex items-center justify-center py-16 text-muted-foreground">
					<Spinner className="mr-2 size-5" />
					{t('policyPage.loading')}
				</div>
			)}

			{isError && isForbidden && (
				<div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
					{t('policyPage.forbidden')}
				</div>
			)}

			{isError && !isForbidden && (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					{t('policy.loadError')}
				</div>
			)}

			{policy && <BillingPolicySummary policy={policy} />}
		</div>
	);
}
