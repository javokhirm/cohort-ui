import { Info } from 'lucide-react';

import { Button, Card, CardContent, cn } from '@repo/ui';

import type { PlanView } from '@/api/plans/types';

import type { OnboardFormData } from './types';
import { useAppT } from '@/locales';

export function ReviewStep({
	data,
	onBack,
	onSubmit,
	submitting,
	plans,
}: {
	data: OnboardFormData;
	onBack: () => void;
	onSubmit: () => void;
	submitting: boolean;
	plans: PlanView[];
}) {
	const t = useAppT('tenants');
	const plan = plans.find((p) => p.id === data.planId);

	const rows: { label: string; value: string }[] = [
		{ label: t('onboarding.businessName'), value: data.centerName },
		{ label: t('onboarding.city'), value: data.city },
		{
			label: t('onboarding.owner'),
			value: `${data.ownerFirstName} ${data.ownerLastName}`,
		},
		{ label: t('onboarding.ownerPhone'), value: data.ownerPhone },
		...(data.ownerEmail
			? [{ label: t('onboarding.ownerEmail'), value: data.ownerEmail }]
			: []),
		{
			label: t('onboarding.plan'),
			value: plan ? `${plan.name} ${t('onboarding.trialSuffix')}` : '—',
		},
		{ label: t('onboarding.initialBranch'), value: data.branchName },
		{ label: t('onboarding.branchCode'), value: data.branchCode },
	];

	return (
		<Card>
			<CardContent className="flex flex-col gap-6 pt-6">
				<div>
					<p className="text-base font-semibold">
						{t('onboarding.reviewTitle')}
					</p>
					<p className="text-sm text-muted-foreground">
						{t('onboarding.reviewSubtitle')}
					</p>
				</div>

				<div className="overflow-hidden rounded-lg border border-border">
					{rows.map((row, i) => (
						<div
							key={row.label}
							className={cn(
								'flex items-center justify-between px-4 py-3 text-sm',
								i > 0 && 'border-t border-border',
							)}
						>
							<span className="text-muted-foreground">{row.label}</span>
							<span className="font-medium">{row.value}</span>
						</div>
					))}
				</div>

				<div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-900/50 dark:bg-blue-950/30">
					<Info className="mt-0.5 size-4 shrink-0 text-blue-600 dark:text-blue-400" />
					<p className="text-sm text-blue-700 dark:text-blue-300">
						{t('onboarding.provisionNote')}
					</p>
				</div>

				<div className="flex justify-between">
					<Button variant="outline" onClick={onBack} disabled={submitting}>
						{t('back')}
					</Button>
					<Button
						className="bg-tone-green-fg text-background hover:bg-tone-green-fg/90"
						onClick={onSubmit}
						disabled={submitting}
					>
						{submitting
							? t('onboarding.creating')
							: t('onboarding.createTenant')}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
