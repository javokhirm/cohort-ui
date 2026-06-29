// TODO: replace CRUD with useMutation(createPlanMutation()) / useMutation(updatePlanMutation()) /
//       useMutation(archivePlanMutation()) and useQuery(plansQuery()) once API endpoints are ready.

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod/v4';
import { Check, Pencil, Plus, Zap } from 'lucide-react';

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
	cn,
} from '@repo/ui';
import { MOCK_PLANS } from './_mock';
import type { MockPlan, PlanFeature } from './_mock';

// ─── Types ────────────────────────────────────────────────────────────────────

type DrawerMode = { kind: 'create' } | { kind: 'edit'; plan: MockPlan };

// ─── Constants ────────────────────────────────────────────────────────────────

const FEATURE_LABELS: Record<PlanFeature, { label: string; description: string }> = {
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

const ALL_FEATURES = Object.keys(FEATURE_LABELS) as PlanFeature[];

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatUzs(amount: number): string {
	if (amount === 0) return 'Custom pricing';
	return new Intl.NumberFormat('ru-RU').format(amount);
}

function limitLabel(value: number | null, unit: string): string {
	if (value === null) return `Unlimited ${unit}`;
	return `${new Intl.NumberFormat('ru-RU').format(value)} ${unit}`;
}

// ─── Zod schema ───────────────────────────────────────────────────────────────

const planSchema = z.object({
	name: z.string().min(1, 'Name is required').max(64),
	priceUzs: z.number().min(0, 'Price must be 0 or more'),
	studentLimit: z.number().int().min(0),
	branchLimit: z.number().int().min(0),
	storageGb: z.number().int().min(1, 'Storage must be at least 1 GB'),
	billing: z.boolean(),
	payroll: z.boolean(),
	assessments: z.boolean(),
	telegram_bot: z.boolean(),
	api_access: z.boolean(),
});

type PlanFormValues = z.infer<typeof planSchema>;

function planToFormValues(plan: MockPlan): PlanFormValues {
	return {
		name: plan.name,
		priceUzs: plan.priceUzs,
		studentLimit: plan.studentLimit ?? 0,
		branchLimit: plan.branchLimit ?? 0,
		storageGb: plan.storageGb,
		billing: plan.features.includes('billing'),
		payroll: plan.features.includes('payroll'),
		assessments: plan.features.includes('assessments'),
		telegram_bot: plan.features.includes('telegram_bot'),
		api_access: plan.features.includes('api_access'),
	};
}

const EMPTY_FORM: PlanFormValues = {
	name: '',
	priceUzs: 0,
	studentLimit: 300,
	branchLimit: 1,
	storageGb: 5,
	billing: false,
	payroll: false,
	assessments: false,
	telegram_bot: false,
	api_access: false,
};

// ─── PlanCard ─────────────────────────────────────────────────────────────────

function PlanCard({
	plan,
	onEdit,
	onArchive,
}: {
	plan: MockPlan;
	onEdit: (plan: MockPlan) => void;
	onArchive: (plan: MockPlan) => void;
}) {
	const isCustom = plan.priceUzs === 0;

	return (
		<Card
			className={cn(
				'relative flex flex-col gap-0 py-0 transition-shadow hover:shadow-md',
				plan.isPopular && 'ring-2 ring-primary',
			)}
		>
			{plan.isPopular && (
				<div className="absolute -top-3 left-1/2 -translate-x-1/2">
					<Badge className="gap-1 bg-primary px-2.5 py-0.5 text-primary-foreground">
						<Zap className="size-3" />
						Most Popular
					</Badge>
				</div>
			)}

			<CardContent className="flex flex-1 flex-col gap-5 px-6 pt-8 pb-6">
				{/* Plan name */}
				<div>
					<p className="text-lg font-bold tracking-tight">{plan.name}</p>
				</div>

				{/* Price */}
				<div>
					{isCustom ? (
						<p className="text-base font-semibold text-muted-foreground">
							Custom pricing
						</p>
					) : (
						<p className="text-2xl font-bold tabular-nums leading-none">
							{formatUzs(plan.priceUzs)}{' '}
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
						{limitLabel(plan.branchLimit, 'branches')}
					</li>
					<li className="flex items-center gap-2 text-sm">
						<Check className="size-4 shrink-0 text-green-600" />
						{limitLabel(plan.studentLimit, 'students')}
					</li>
					<li className="flex items-center gap-2 text-sm">
						<Check className="size-4 shrink-0 text-green-600" />
						{plan.storageGb} GB storage
					</li>
					{plan.features.map((f) => (
						<li key={f} className="flex items-center gap-2 text-sm">
							<Check className="size-4 shrink-0 text-green-600" />
							{FEATURE_LABELS[f].label}
						</li>
					))}
				</ul>

				<div className="mt-auto flex flex-col gap-3 pt-2">
					<Separator />

					{/* Tenant count */}
					<p className="text-sm text-muted-foreground">
						{plan.tenantCount} tenant{plan.tenantCount !== 1 ? 's' : ''} on
						this plan
					</p>

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
							onClick={() => onArchive(plan)}
						>
							Archive
						</Button>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}

// ─── PlanDrawer ───────────────────────────────────────────────────────────────

function PlanDrawer({
	mode,
	open,
	onOpenChange,
	onSave,
}: {
	mode: DrawerMode;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (values: PlanFormValues) => void;
}) {
	const isEdit = mode.kind === 'edit';
	const defaultValues = isEdit ? planToFormValues(mode.plan) : EMPTY_FORM;

	const form = useForm<PlanFormValues>({
		resolver: zodResolver(planSchema),
		defaultValues,
	});

	function handleSubmit(values: PlanFormValues) {
		onSave(values);
		onOpenChange(false);
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

						{/* Price */}
						<FormField
							control={form.control}
							name="priceUzs"
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
									<p className="text-xs text-muted-foreground">
										Set to 0 for custom / negotiated pricing.
									</p>
									<FormMessage />
								</FormItem>
							)}
						/>

						{/* Limits row */}
						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="studentLimit"
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
								name="branchLimit"
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

						{/* Storage */}
						<FormField
							control={form.control}
							name="storageGb"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Storage (GB)</FormLabel>
									<FormControl>
										<Input
											type="number"
											min={1}
											placeholder="25"
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
							<Button type="submit" className="flex-1">
								{isEdit ? 'Save changes' : 'Create plan'}
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
	const [plans, setPlans] = useState(MOCK_PLANS);
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [drawerMode, setDrawerMode] = useState<DrawerMode>({ kind: 'create' });

	function openCreate() {
		setDrawerMode({ kind: 'create' });
		setDrawerOpen(true);
	}

	function openEdit(plan: MockPlan) {
		setDrawerMode({ kind: 'edit', plan });
		setDrawerOpen(true);
	}

	function handleArchive(plan: MockPlan) {
		// TODO: call useMutation(archivePlanMutation()) once API is ready.
		setPlans((prev) =>
			prev.map((p) => (p.id === plan.id ? { ...p, archived: true } : p)),
		);
	}

	function handleSave(values: PlanFormValues) {
		// TODO: call useMutation(createPlanMutation()) or useMutation(updatePlanMutation()) once API is ready.
		const features = ALL_FEATURES.filter((f) => values[f]);
		if (drawerMode.kind === 'create') {
			const newPlan: MockPlan = {
				id: `plan-${Date.now()}`,
				name: values.name,
				priceUzs: values.priceUzs,
				studentLimit: values.studentLimit === 0 ? null : values.studentLimit,
				branchLimit: values.branchLimit === 0 ? null : values.branchLimit,
				storageGb: values.storageGb,
				features,
				isPopular: false,
				tenantCount: 0,
				archived: false,
			};
			setPlans((prev) => [...prev, newPlan]);
		} else {
			setPlans((prev) =>
				prev.map((p) =>
					p.id === drawerMode.plan.id
						? {
								...p,
								name: values.name,
								priceUzs: values.priceUzs,
								studentLimit:
									values.studentLimit === 0
										? null
										: values.studentLimit,
								branchLimit:
									values.branchLimit === 0 ? null : values.branchLimit,
								storageGb: values.storageGb,
								features,
							}
						: p,
				),
			);
		}
	}

	const visiblePlans = plans.filter((p) => !p.archived);

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
				<Button onClick={openCreate} className="gap-1.5">
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

			{/* ── Plan cards grid ──────────────────────────────────────────── */}
			{visiblePlans.length === 0 ? (
				<p className="py-16 text-center text-sm text-muted-foreground">
					No active plans. Create one above.
				</p>
			) : (
				<div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
					{visiblePlans.map((plan) => (
						<PlanCard
							key={plan.id}
							plan={plan}
							onEdit={openEdit}
							onArchive={handleArchive}
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
			/>
		</div>
	);
}
