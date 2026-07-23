import { AlertTriangle } from 'lucide-react';

import { Skeleton } from '@repo/ui';

import { useTenantBillingPolicy } from '../../hooks';
import { BillingPolicyForm } from './BillingPolicyForm';
import { useAppT } from '@/locales';

/**
 * The tenant's billing policy. The platform console is the ONLY place this can be
 * changed: it decides when every one of the tenant's invoices is generated, when
 * it falls due, and when unpaid enrollments get auto-suspended, so tenant staff
 * can read it but not edit it.
 */
export function BillingPolicyTab({ tenantId }: { tenantId: number }) {
	const t = useAppT('tenants');
	const { data: policy, isLoading, isError } = useTenantBillingPolicy(tenantId, true);

	if (isLoading) {
		return (
			<div className="flex max-w-3xl flex-col gap-6">
				<Skeleton className="h-16 w-full" />
				<Skeleton className="h-64 w-full" />
				<Skeleton className="h-48 w-full" />
			</div>
		);
	}

	if (isError || !policy) {
		return (
			<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
				{t('policy.loadError')}
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div className="flex max-w-3xl items-start gap-3 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
				<AlertTriangle className="mt-0.5 size-4 shrink-0 text-amber-500" />
				<div className="flex flex-col gap-1 text-sm">
					<p className="font-medium">{t('policy.warningTitle')}</p>
					<p className="text-muted-foreground">{t('policy.warningBody')}</p>
				</div>
			</div>

			<BillingPolicyForm tenantId={tenantId} policy={policy} />
		</div>
	);
}
