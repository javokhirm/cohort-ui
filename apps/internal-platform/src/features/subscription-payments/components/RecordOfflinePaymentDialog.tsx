import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Info } from 'lucide-react';

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui';

import { plansKeys } from '@/api/plans/keys';
import { listPlans } from '@/api/plans/plans.queries';
import {
	OFFLINE_PAYMENT_METHODS,
	type BillingInterval,
	type OfflinePaymentMethod,
} from '@/api/subscription-payments/types';
import { useAppT } from '@/locales';
import { useT } from '@repo/i18n';

import { paymentMethodLabel } from '../constants';
import { useRecordOfflinePayment } from '../hooks';

const KEEP_CURRENT = 'current';

/**
 * Record an offline (bank transfer / cash) subscription settlement. The method
 * picker is restricted to the two offline methods — online methods must settle
 * through their gateway (the API rejects them with 400). On success the tenant's
 * period extends and access is restored immediately.
 */
export function RecordOfflinePaymentDialog({
	tenantId,
	currentTierId,
	open,
	onOpenChange,
}: {
	tenantId: number;
	currentTierId: number | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const t = useAppT('payments');
	const tc = useT('common');

	const [method, setMethod] = useState<OfflinePaymentMethod>('BANK_TRANSFER');
	const [tier, setTier] = useState<string>(KEEP_CURRENT);
	const [interval, setInterval] = useState<string>(KEEP_CURRENT);
	const [reference, setReference] = useState('');

	const { data: plansPage } = useQuery({
		queryKey: plansKeys.list({ isActive: true }),
		queryFn: () => listPlans({ isActive: true, limit: 100 }),
		enabled: open,
	});
	const plans = plansPage?.rows ?? [];

	// Fresh state per open is guaranteed by remounting at the call site (keyed on
	// the open flag), so no reset effect is needed here.
	const mutation = useRecordOfflinePayment(tenantId, {
		onSuccess: () => onOpenChange(false),
	});

	function handleSubmit() {
		mutation.mutate({
			method,
			subscriptionTierId: tier === KEEP_CURRENT ? undefined : Number(tier),
			billingInterval:
				interval === KEEP_CURRENT ? undefined : (interval as BillingInterval),
			reference: reference.trim() || undefined,
		});
	}

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[480px]">
				<DialogHeader>
					<DialogTitle>{t('record.title')}</DialogTitle>
					<DialogDescription>{t('record.description')}</DialogDescription>
				</DialogHeader>

				<div className="flex gap-2.5 rounded-lg border border-tone-blue-fg/30 bg-tone-blue-bg/50 px-3.5 py-3 text-sm text-tone-blue-fg">
					<Info className="mt-0.5 size-4 shrink-0" />
					<p>{t('record.accessNotice')}</p>
				</div>

				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<Label>{t('record.methodLabel')}</Label>
						<Select
							value={method}
							onValueChange={(v) => setMethod(v as OfflinePaymentMethod)}
						>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								{OFFLINE_PAYMENT_METHODS.map((m) => (
									<SelectItem key={m} value={m}>
										{paymentMethodLabel(t, m)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
						<p className="text-xs text-muted-foreground">
							{t('record.methodHint')}
						</p>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label>{t('record.planLabel')}</Label>
						<Select value={tier} onValueChange={setTier}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={KEEP_CURRENT}>
									{t('record.keepCurrentPlan')}
								</SelectItem>
								{plans.map((plan) => (
									<SelectItem key={plan.id} value={String(plan.id)}>
										{plan.name}
										{plan.id === currentTierId
											? ` · ${t('record.currentPlanTag')}`
											: ''}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label>{t('record.intervalLabel')}</Label>
						<Select value={interval} onValueChange={setInterval}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={KEEP_CURRENT}>
									{t('record.keepCurrentInterval')}
								</SelectItem>
								<SelectItem value="MONTHLY">
									{t('record.monthly')}
								</SelectItem>
								<SelectItem value="ANNUAL">
									{t('record.annual')}
								</SelectItem>
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-1.5">
						<Label htmlFor="record-reference">
							{t('record.referenceLabel')}
						</Label>
						<Input
							id="record-reference"
							value={reference}
							onChange={(e) => setReference(e.target.value)}
							placeholder={t('record.referencePlaceholder')}
						/>
					</div>
				</div>

				{mutation.isError && (
					<p className="text-sm text-destructive">
						{mutation.error instanceof Error
							? mutation.error.message
							: t('record.error')}
					</p>
				)}

				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={mutation.isPending}
					>
						{tc('action.cancel')}
					</Button>
					<Button onClick={handleSubmit} disabled={mutation.isPending}>
						{mutation.isPending ? t('record.submitting') : t('record.submit')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
