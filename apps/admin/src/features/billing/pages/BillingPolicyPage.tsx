import { Lock } from 'lucide-react';

import { Card, CardHeader, CardTitle, PageHeader, Spinner } from '@repo/ui';
import { isApiError } from '@repo/api-client';

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
	const { data: policy, isLoading, isError, error } = useBillingPolicy();

	const isForbidden = isApiError(error) && error.status === 403;

	return (
		<div className="mx-auto flex max-w-3xl flex-col gap-6">
			<PageHeader
				title="Billing Policy"
				description="How this center's invoices are generated, when they fall due, and how overdue accounts are handled"
			/>

			<Card>
				<CardHeader className="flex flex-row items-start gap-3 space-y-0">
					<span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
						<Lock className="size-4" />
					</span>
					<div className="flex flex-col gap-1">
						<CardTitle className="text-sm font-semibold">
							Managed by Cohort
						</CardTitle>
						<p className="text-sm font-normal text-muted-foreground">
							This policy drives every invoice your center issues, so it is
							configured by the Cohort team rather than changed here.
							Contact support to request a change — it takes effect from
							your next billing run and never alters invoices that have
							already been issued.
						</p>
					</div>
				</CardHeader>
			</Card>

			{isLoading && (
				<div className="flex items-center justify-center py-16 text-muted-foreground">
					<Spinner className="mr-2 size-5" />
					Loading billing policy…
				</div>
			)}

			{isError && isForbidden && (
				<div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
					You don&apos;t have permission to view the billing policy.
				</div>
			)}

			{isError && !isForbidden && (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					Failed to load the billing policy. Please refresh.
				</div>
			)}

			{policy && <BillingPolicySummary policy={policy} />}
		</div>
	);
}
