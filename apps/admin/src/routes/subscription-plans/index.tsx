import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod/v4';
import { Check, Pencil, Plus } from 'lucide-react';

import {
	Badge,
	Button,
	Card,
	CardContent,
	Checkbox,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Label,
	Separator,
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
	Skeleton,
	cn,
} from '@repo/ui';

import { formatUzs } from '@/lib/formatters/currency';
import { plansKeys } from '@/features/plans/api/keys';
import { listPlans } from '@/features/plans/api/plans.queries';
import { createPlan, updatePlan } from '@/features/plans/api/plans.mutations';
import type { PlanView } from '@/features/plans/api/types';

// ─── Constants ────────────────────────────────────────────────────────────────

type FeatureKey = 'billing' | 'payroll' | 'assessments' | 'telegram_bot' | 'api_access';

const FEATURE_LABELS: Record<FeatureKey, { label: string; description: string }> = {
	billing: {
		label: 'Billing module',
		description: 'Invoices, payments & revenue tracking',
	},
	payroll: {
		label: 'Payroll module',
		description: 'Staff salary & payslip management',
	},
	assessments: {
		label: 'Assessments',
		description: 'Tests, grades & progress tracking',
	},
	telegram_bot: {
		label: 'Telegram bot',
		description: 'Parent notifications via Telegram',
	},
	api_access: { label: 'API access', description: 'REST API key for integrations' },
};

const ALL_FEATURES = Object.keys(FEATURE_LABELS) as FeatureKey[];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function limitLabel(value: number | null, unit: string): string {
	if (value === null) return `Unlimited ${unit}`;
	return `${new Intl.NumberFormat('ru-RU').format(value)} ${unit}`;
}

function planFeatures(plan: PlanView): FeatureKey[] {
	return ALL_FEATURES.filter((f) => Boolean(plan.features[f]));
}

// ─── Zod schema ───────────────────────────────────────────────────────────────

const planSchema = z.object({
	name: z.string().min(1, 'Name is required').max(64),
	priceMonthly: z.number().min(0, 'Price must be 0 or more'),
	priceAnnual: z.number().min(0, 'Price must be 0 or more'),
	maxStudents: z.number().int().min(0),
	maxBranches: z.number().int().min(0),
	storageGb: z.number().int().min(1, 'Storage must be at least 1 GB').optional(),
	billing: z.boolean(),
	payroll: z.boolean(),
	assessments: z.boolean(),
	telegram_bot: z.boolean(),
	api_access: z.boolean(),
	isActive: z.boolean(),
});

type PlanFormValues = z.infer<typeof planSchema>;

function planToFormValues(plan: PlanView): PlanFormValues {
	return {
		name: plan.name,
		priceMonthly: plan.priceMonthly,
		priceAnnual: plan.priceAnnual,
		maxStudents: plan.maxStudents ?? 0,
		maxBranches: plan.maxBranches ?? 0,
		billing: Boolean(plan.features['billing']),
		payroll: Boolean(plan.features['payroll']),
		assessments: Boolean(plan.features['assessments']),
		telegram_bot: Boolean(plan.features['telegram_bot']),
		api_access: Boolean(plan.features['api_access']),
		isActive: plan.isActive,
	};
}

const EMPTY_FORM: PlanFormValues = {
	name: '',
	priceMonthly: 0,
	priceAnnual: 0,
	maxStudents: 300,
	maxBranches: 1,
	billing: false,
	payroll: false,
	assessments: false,
	telegram_bot: false,
	api_access: false,
	isActive: true,
};

function formValuesToInput(values: PlanFormValues) {
	const features: Record<string, boolean> = {};
	for (const f of ALL_FEATURES) {
		features[f] = values[f];
	}
	return {
		name: values.name,
		priceMonthly: values.priceMonthly,
		priceAnnual: values.priceAnnual,
		maxStudents: values.maxStudents === 0 ? null : values.maxStudents,
		maxBranches: values.maxBranches === 0 ? null : values.maxBranches,
		features,
		isActive: values.isActive,
	};
}

// ─── PlanCard ─────────────────────────────────────────────────────────────────

function PlanCard({
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
				{/* Plan name */}
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

				{/* Price */}
				<div>
					{isCustom ? (
						<p className="text-base font-semibold text-muted-foreground">
							Custom pricing
						</p>
					) : (
						<p className="text-2xl font-bold tabular-nums leading-none">
							{formatUzs(plan.priceMonthly)}{' '}
							<span className="text-sm font-normal text-muted-foreground">
								UZS / month
							</span>
						</p>
					)}
				</div>

				{/* Feature list */}
				<ul className="flex flex-col gap-2">
					<li className="flex items-center gap-2 text-sm">
						<Check className="size-4 shrink-0 text-green-600" />
						{limitLabel(plan.maxBranches, 'branches')}
					</li>
					<li className="flex items-center gap-2 text-sm">
						<Check className="size-4 shrink-0 text-green-600" />
						{limitLabel(plan.maxStudents, 'students')}
					</li>
					{features.map((f) => (
						<li key={f} className="flex items-center gap-2 text-sm">
							<Check className="size-4 shrink-0 text-green-600" />
							{FEATURE_LABELS[f].label}
						</li>
					))}
				</ul>

				<div className="mt-auto flex flex-col gap-3 pt-2">
					<Separator />

					{/* Actions */}
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

// ─── PlanSkeleton ─────────────────────────────────────────────────────────────

function PlanSkeleton() {
	return (
		<Card className="py-0">
			<CardContent className="flex flex-col gap-5 px-6 pt-8 pb-6">
				<Skeleton className="h-6 w-28" />
				<Skeleton className="h-8 w-40" />
				<div className="flex flex-col gap-2">
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-4 w-36" />
					<Skeleton className="h-4 w-28" />
				</div>
				<Skeleton className="mt-auto h-9 w-full" />
			</CardContent>
		</Card>
	);
}

// ─── PlanDrawer ───────────────────────────────────────────────────────────────

type DrawerMode = { kind: 'create' } | { kind: 'edit'; plan: PlanView };

function PlanDrawer({
	mode,
	open,
	onOpenChange,
	onSave,
	saving,
}: {
	mode: DrawerMode;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (values: PlanFormValues) => void;
	saving: boolean;
}) {
	const isEdit = mode.kind === 'edit';
	const defaultValues = isEdit ? planToFormValues(mode.plan) : EMPTY_FORM;

	const form = useForm<PlanFormValues>({
		resolver: zodResolver(planSchema),
		defaultValues,
	});

	function handleSubmit(values: PlanFormValues) {
		onSave(values);
	}

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="w-[480px] sm:max-w-[480px] overflow-y-auto"
			>
				<SheetHeader className="pb-2">
					<SheetTitle>{isEdit ? 'Edit plan' : 'Create plan'}</SheetTitle>
				</SheetHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(handleSubmit)}
						className="flex flex-1 flex-col gap-5 px-4 py-2"
					>
						{/* Name */}
						<FormField
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Plan name</FormLabel>
									<FormControl>
										<Input placeholder="e.g. Growth" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Prices row */}
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="priceMonthly"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Monthly price (UZS)</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={0}
												placeholder="2400000"
												{...field}
												onChange={(e) =>
													field.onChange(Number(e.target.value))
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="priceAnnual"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Annual price (UZS)</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={0}
												placeholder="24000000"
												{...field}
												onChange={(e) =>
													field.onChange(Number(e.target.value))
												}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Limits row */}
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="maxStudents"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Student limit</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={0}
												placeholder="300"
												{...field}
												onChange={(e) =>
													field.onChange(Number(e.target.value))
												}
											/>
										</FormControl>
										<p className="text-xs text-muted-foreground">
											0 = unlimited
										</p>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="maxBranches"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Branch limit</FormLabel>
										<FormControl>
											<Input
												type="number"
												min={0}
												placeholder="5"
												{...field}
												onChange={(e) =>
													field.onChange(Number(e.target.value))
												}
											/>
										</FormControl>
										<p className="text-xs text-muted-foreground">
											0 = unlimited
										</p>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						{/* Feature toggles */}
						<div className="flex flex-col gap-3">
							<Label className="text-sm font-medium">
								Features included
							</Label>
							{ALL_FEATURES.map((feature) => (
								<FormField
									key={feature}
									control={form.control}
									name={feature}
									render={({ field }) => (
										<FormItem className="flex items-start gap-3 space-y-0">
											<FormControl>
												<Checkbox
													checked={field.value as boolean}
													onCheckedChange={field.onChange}
													className="mt-0.5"
												/>
											</FormControl>
											<div>
												<FormLabel className="text-sm font-medium leading-none">
													{FEATURE_LABELS[feature].label}
												</FormLabel>
												<p className="mt-0.5 text-xs text-muted-foreground">
													{FEATURE_LABELS[feature].description}
												</p>
											</div>
										</FormItem>
									)}
								/>
							))}
						</div>

						<SheetFooter className="mt-auto flex flex-row gap-2 px-0 pb-0">
							<Button
								type="button"
								variant="outline"
								className="flex-1"
								onClick={() => onOpenChange(false)}
							>
								Cancel
							</Button>
							<Button type="submit" className="flex-1" disabled={saving}>
								{saving
									? isEdit
										? 'Saving…'
										: 'Creating…'
									: isEdit
										? 'Save changes'
										: 'Create plan'}
							</Button>
						</SheetFooter>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function SubscriptionPlansPage() {
	const queryClient = useQueryClient();
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [drawerMode, setDrawerMode] = useState<DrawerMode>({ kind: 'create' });

	const {
		data: plansPage,
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: plansKeys.list(),
		queryFn: () => listPlans({ limit: 100 }),
	});

	const createMutation = useMutation({
		mutationFn: createPlan,
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: plansKeys.all });
			setDrawerOpen(false);
		},
	});

	const updateMutation = useMutation({
		mutationFn: ({
			id,
			input,
		}: {
			id: number;
			input: Parameters<typeof updatePlan>[1];
		}) => updatePlan(id, input),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: plansKeys.all });
			setDrawerOpen(false);
		},
	});

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
			{/* ── Page header ──────────────────────────────────────────────── */}
			<div className="flex items-start justify-between">
				<div>
					<h1 className="text-xl font-semibold tracking-tight">
						Subscription Plans
					</h1>
					<p className="text-sm text-muted-foreground">
						Tiers, pricing and feature flags applied across every tenant.
					</p>
				</div>
				<Button onClick={openCreate} className="gap-1.5" disabled={isLoading}>
					<Plus className="size-4" />
					Create plan
				</Button>
			</div>

			{/* ── Warning banner ───────────────────────────────────────────── */}
			<div className="flex items-center gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300">
				<span className="shrink-0 text-base">⚠</span>
				<p>
					Editing a tier's pricing or flags affects{' '}
					<strong>all tenants currently on that plan</strong>.
				</p>
			</div>

			{/* ── Error state ──────────────────────────────────────────────── */}
			{isError && (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					Failed to load plans
					{error instanceof Error ? `: ${error.message}` : '.'} Please refresh.
				</div>
			)}

			{/* ── Plan cards grid ──────────────────────────────────────────── */}
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

			{/* ── Create / Edit drawer ─────────────────────────────────────── */}
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
