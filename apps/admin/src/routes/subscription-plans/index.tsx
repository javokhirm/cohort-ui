import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Button } from '@repo/ui';
import type { PlanView } from '@/api/plans/types';

import { PlanCard } from '@/features/subscription-plans/components/PlanCard';
import { PlanDrawer } from '@/features/subscription-plans/components/PlanDrawer';
import { PlanSkeleton } from '@/features/subscription-plans/components/PlanSkeleton';
import { useCreatePlan, usePlans, useUpdatePlan } from '@/features/subscription-plans/hooks';
import { formValuesToInput, type DrawerMode, type PlanFormValues } from '@/features/subscription-plans/schemas';

export function SubscriptionPlansPage() {
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [drawerMode, setDrawerMode] = useState<DrawerMode>({ kind: 'create' });

	const { data: plansPage, isLoading, isError, error } = usePlans();

	const createMutation = useCreatePlan({ onSuccess: () => setDrawerOpen(false) });
	const updateMutation = useUpdatePlan({ onSuccess: () => setDrawerOpen(false) });

	function openCreate() {
		setDrawerMode({ kind: 'create' });
		setDrawerOpen(true);
	}

	function openEdit(plan: PlanView) {
		setDrawerMode({ kind: 'edit', plan });
		setDrawerOpen(true);
	}

	function handleDeactivate(plan: PlanView) {
		updateMutation.mutate({ id: plan.id, input: { isActive: false } });
	}

	function handleSave(values: PlanFormValues) {
		const input = formValuesToInput(values);
		if (drawerMode.kind === 'create') {
			createMutation.mutate(input);
		} else {
			updateMutation.mutate({ id: drawerMode.plan.id, input });
		}
	}

	const saving = createMutation.isPending || updateMutation.isPending;
	const activePlans = plansPage?.rows.filter((p) => p.isActive) ?? [];

	return (
		<div className="flex flex-col gap-6">
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-xl font-semibold tracking-tight">Subscription Plans</h1>
					<p className="text-sm text-muted-foreground">
						Tiers, pricing and feature flags applied across every tenant.
					</p>
				</div>
				<Button onClick={openCreate} className="gap-1.5" disabled={isLoading}>
					<Plus className="size-4" />
					Create plan
				</Button>
			</div>

			<div className="flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
				<span className="shrink-0 text-base">⚠</span>
				<p>
					Editing a tier's pricing or flags affects{' '}
					<strong>all tenants currently on that plan</strong>.
				</p>
			</div>

			{isError && (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					Failed to load plans
					{error instanceof Error ? `: ${error.message}` : '.'} Please refresh.
				</div>
			)}

			{isLoading ? (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{Array.from({ length: 3 }, (_, i) => (
						<PlanSkeleton key={i} />
					))}
				</div>
			) : activePlans.length === 0 ? (
				<p className="py-16 text-center text-sm text-muted-foreground">
					No active plans. Create one above.
				</p>
			) : (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{activePlans.map((plan) => (
						<PlanCard
							key={plan.id}
							plan={plan}
							onEdit={openEdit}
							onDeactivate={handleDeactivate}
						/>
					))}
				</div>
			)}

			<PlanDrawer
				mode={drawerMode}
				open={drawerOpen}
				onOpenChange={setDrawerOpen}
				onSave={handleSave}
				saving={saving}
			/>
		</div>
	);
}
