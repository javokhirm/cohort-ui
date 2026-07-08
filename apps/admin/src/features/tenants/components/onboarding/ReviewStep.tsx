import { Info } from 'lucide-react';

import { Button, Card, CardContent, cn } from '@repo/ui';

import type { PlanView } from '@/api/plans/types';

import type { OnboardFormData } from './types';

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
	const plan = plans.find((p) => p.id === data.planId);

	const rows: { label: string; value: string }[] = [
		{ label: 'Center name', value: data.centerName },
		{ label: 'City', value: data.city },
		{ label: 'Owner', value: `${data.ownerFirstName} ${data.ownerLastName}` },
		{ label: 'Owner phone', value: data.ownerPhone },
		...(data.ownerEmail ? [{ label: 'Owner email', value: data.ownerEmail }] : []),
		{ label: 'Plan', value: plan ? `${plan.name} (14-day trial)` : '—' },
		{ label: 'Initial branch', value: data.branchName },
		{ label: 'Branch code', value: data.branchCode },
	];

	return (
		<Card>
			<CardContent className="flex flex-col gap-6 pt-6">
				<div>
					<p className="text-base font-semibold">Review & create</p>
					<p className="text-sm text-muted-foreground">
						Confirm the details before provisioning the tenant.
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
						A welcome SMS & default role templates will be provisioned
						automatically.
					</p>
				</div>

				<div className="flex justify-between">
					<Button variant="outline" onClick={onBack} disabled={submitting}>
						Back
					</Button>
					<Button
						className="bg-green-600 text-white hover:bg-green-700"
						onClick={onSubmit}
						disabled={submitting}
					>
						{submitting ? 'Creating…' : 'Create tenant'}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
