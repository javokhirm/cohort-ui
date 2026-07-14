import { Check, Pencil } from 'lucide-react';

import { Badge, Button, Card, CardContent, Separator, cn } from '@repo/ui';
import { formatPrice } from '@repo/utils';
import type { PlanView } from '@/api/plans/types';

import { FEATURE_LABELS } from '../constants';
import { limitLabel, planFeatures } from '../utils';

export function PlanCard({
	plan,
	onEdit,
	onDeactivate,
}: {
	plan: PlanView;
	onEdit: (plan: PlanView) => void;
	onDeactivate: (plan: PlanView) => void;
}) {
	const isCustom = plan.priceMonthly === 0;
	const features = planFeatures(plan);

	return (
		<Card
			className={cn(
				'relative flex flex-col gap-0 py-0 transition-shadow hover:shadow-md',
			)}
		>
			<CardContent className="flex flex-1 flex-col gap-5 px-6 pt-8 pb-6">
				<div>
					<p className="text-lg font-bold tracking-tight">{plan.name}</p>
					{!plan.isActive && (
						<Badge
							variant="outline"
							className="mt-1 text-xs text-muted-foreground"
						>
							Inactive
						</Badge>
					)}
				</div>

				<div>
					{isCustom ? (
						<p className="text-base font-semibold text-muted-foreground">
							Custom pricing
						</p>
					) : (
						<p className="text-2xl font-bold tabular-nums leading-none">
							{formatPrice(plan.priceMonthly)}{' '}
							<span className="text-sm font-normal text-muted-foreground">
								UZS / month
							</span>
						</p>
					)}
				</div>

				<ul className="flex flex-col gap-2">
					<li className="flex items-center gap-2 text-sm">
						<Check className="size-4 shrink-0 text-tone-green-fg" />
						{limitLabel(plan.maxBranches, 'branches')}
					</li>
					<li className="flex items-center gap-2 text-sm">
						<Check className="size-4 shrink-0 text-tone-green-fg" />
						{limitLabel(plan.maxStudents, 'students')}
					</li>
					{features.map((f) => (
						<li key={f} className="flex items-center gap-2 text-sm">
							<Check className="size-4 shrink-0 text-tone-green-fg" />
							{FEATURE_LABELS[f].label}
						</li>
					))}
				</ul>

				<div className="mt-auto flex flex-col gap-3 pt-2">
					<Separator />
					<div className="flex gap-2">
						<Button
							variant="outline"
							size="sm"
							className="flex-1 gap-1.5"
							onClick={() => onEdit(plan)}
						>
							<Pencil className="size-3.5" />
							Edit
						</Button>
						<Button
							variant="ghost"
							size="sm"
							className="flex-1 text-destructive hover:bg-destructive/10 hover:text-destructive"
							onClick={() => onDeactivate(plan)}
							disabled={!plan.isActive}
						>
							Deactivate
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
