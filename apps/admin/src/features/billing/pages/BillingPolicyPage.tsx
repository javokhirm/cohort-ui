import { PageHeader, Spinner } from '@repo/ui';
import { isApiError } from '@repo/api-client';

import { useBillingPolicy } from '../api/billing-policy.queries';
import { BillingPolicyForm } from '../components/BillingPolicyForm';

export function BillingPolicyPage() {
	const { data: policy, isLoading, isError, error } = useBillingPolicy();

	const isForbidden = isApiError(error) && error.status === 403;

	return (
		<div className="mx-auto flex max-w-3xl flex-col gap-6">
			<PageHeader
				title="Billing Policy"
				description="Tenant-wide defaults for invoicing, proration, late fees and dunning"
			/>

			{isLoading && (
				<div className="flex items-center justify-center py-16 text-muted-foreground">
					<Spinner className="mr-2 size-5" />
					Loading billing policy…
				</div>
			)}

			{isError && isForbidden && (
				<div className="rounded-lg border border-border bg-muted/40 px-4 py-3 text-sm text-muted-foreground">
					You don&apos;t have permission to manage the billing policy. This is
					restricted to the account owner.
				</div>
			)}

			{isError && !isForbidden && (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					Failed to load the billing policy. Please refresh.
				</div>
			)}

			{policy && <BillingPolicyForm policy={policy} />}
		</div>
	);
}
