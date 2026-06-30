import { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import {
	Ban,
	Eye,
	Globe,
	GraduationCap,
	MapPin,
	PauseCircle,
	PlayCircle,
	Users,
	Wallet,
} from 'lucide-react';

import {
	Avatar,
	AvatarFallback,
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
	RadioGroup,
	RadioGroupItem,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Skeleton,
	StatusBadge,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	cn,
} from '@repo/ui';
import type { StatusTone } from '@repo/ui';

import { plansKeys } from '@/features/plans/api/keys';
import { listPlans } from '@/features/plans/api/plans.queries';
import type { PlanView } from '@/features/plans/api/types';
import { tenantsKeys } from '@/features/tenants/api/keys';
import {
	cancelTenant,
	changeTenantPlan,
	suspendTenant,
	unsuspendTenant,
	updateTenant,
} from '@/features/tenants/api/tenants.mutations';
import { getTenant } from '@/features/tenants/api/tenants.queries';
import type {
	BillingInterval,
	TenantBranchView,
	TenantDetailView,
	TenantMemberView,
	TenantStatus,
	UpdateTenantInput,
} from '@/features/tenants/api/types';
import { formatUzs } from '@/lib/formatters/currency';

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
	'bg-tone-indigo-bg text-tone-indigo-fg',
	'bg-tone-violet-bg text-tone-violet-fg',
	'bg-tone-cyan-bg text-tone-cyan-fg',
	'bg-tone-green-bg text-tone-green-fg',
	'bg-tone-red-bg text-tone-red-fg',
	'bg-tone-blue-bg text-tone-blue-fg',
	'bg-tone-amber-bg text-tone-amber-fg',
	'bg-tone-pink-bg text-tone-pink-fg',
	'bg-tone-orange-bg text-tone-orange-fg',
	'bg-tone-slate-bg text-tone-slate-fg',
];

const SUB_STATUS_TONE: Record<string, StatusTone> = {
	TRIALING: 'blue',
	ACTIVE: 'green',
	PAST_DUE: 'amber',
	CANCELLED: 'slate',
};

const SUB_STATUS_LABEL: Record<string, string> = {
	TRIALING: 'Trialing',
	ACTIVE: 'Active',
	PAST_DUE: 'Past due',
	CANCELLED: 'Cancelled',
};

const MEMBER_STATUS_TONE: Record<string, StatusTone> = {
	ACTIVE: 'green',
	INVITED: 'blue',
	INACTIVE: 'slate',
};

const MEMBER_STATUS_LABEL: Record<string, string> = {
	ACTIVE: 'Active',
	INVITED: 'Invited',
	INACTIVE: 'Inactive',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
	return name
		.split(' ')
		.slice(0, 2)
		.map((w) => w[0])
		.join('')
		.toUpperCase();
}

function avatarClass(id: number): string {
	return AVATAR_PALETTE[id % AVATAR_PALETTE.length];
}

function formatDate(iso: string): string {
	return new Intl.DateTimeFormat('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	}).format(new Date(iso));
}

// ─── TypeToConfirmDialog ──────────────────────────────────────────────────────

interface TypeToConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	confirmLabel: string;
	tenantName: string;
	onConfirm: () => void;
	loading?: boolean;
	variant?: 'default' | 'destructive';
}

function TypeToConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel,
	tenantName,
	onConfirm,
	loading = false,
	variant = 'default',
}: TypeToConfirmDialogProps) {
	const [value, setValue] = useState('');

	function handleOpenChange(next: boolean) {
		if (!next) setValue('');
		onOpenChange(next);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-2">
					<Label htmlFor="type-confirm-input">
						Type <strong>{tenantName}</strong> to confirm
					</Label>
					<Input
						id="type-confirm-input"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						placeholder={tenantName}
					/>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => handleOpenChange(false)}>
						Cancel
					</Button>
					<Button
						variant={variant === 'destructive' ? 'destructive' : 'default'}
						disabled={value !== tenantName || loading}
						onClick={onConfirm}
					>
						{loading ? 'Processing…' : confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ─── ChangePlanDialog ─────────────────────────────────────────────────────────

function planLimitLabel(plan: PlanView): string {
	const students =
		plan.maxStudents != null ? `${plan.maxStudents} students` : 'Unlimited students';
	const branches =
		plan.maxBranches != null ? `${plan.maxBranches} branches` : 'Unlimited branches';
	return `${students} · ${branches}`;
}

function annualSavingsPct(plan: PlanView): number | null {
	if (plan.priceMonthly === 0 || plan.priceAnnual === 0) return null;
	const pct = Math.round(
		((plan.priceMonthly * 12 - plan.priceAnnual) / (plan.priceMonthly * 12)) * 100,
	);
	return pct > 0 ? pct : null;
}

function ChangePlanDialog({
	open,
	onOpenChange,
	tenantId,
	currentTierId,
	currentBillingInterval,
}: {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	tenantId: number;
	currentTierId: number | null;
	currentBillingInterval: BillingInterval | null;
}) {
	const [step, setStep] = useState<'select' | 'confirm'>('select');
	const [billingInterval, setBillingInterval] = useState<BillingInterval>(
		currentBillingInterval ?? 'MONTHLY',
	);
	const [selectedPlanId, setSelectedPlanId] = useState<number | null>(currentTierId);

	const queryClient = useQueryClient();

	const { data: plansPage, isLoading: plansLoading } = useQuery({
		queryKey: plansKeys.list({ isActive: true }),
		queryFn: () => listPlans({ isActive: true, limit: 100 }),
		enabled: open,
	});
	const plans = plansPage?.rows ?? [];

	const mutation = useMutation({
		mutationFn: () =>
			changeTenantPlan(tenantId, {
				subscriptionTierId: selectedPlanId!,
				billingInterval,
			}),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: tenantsKeys.detail(tenantId),
			});
			onOpenChange(false);
		},
	});

	function handleOpenChange(next: boolean) {
		if (!next) {
			setStep('select');
			mutation.reset();
		}
		onOpenChange(next);
	}

	const selectedPlan = plans.find((p) => p.id === selectedPlanId) ?? null;
	const currentPlan = plans.find((p) => p.id === currentTierId) ?? null;

	const isUnchanged =
		selectedPlanId === currentTierId &&
		billingInterval === (currentBillingInterval ?? 'MONTHLY');

	function priceFor(plan: PlanView) {
		return billingInterval === 'ANNUAL' ? plan.priceAnnual : plan.priceMonthly;
	}

	const priceSuffix = billingInterval === 'ANNUAL' ? '/yr' : '/mo';

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="sm:max-w-[560px]">
				{step === 'select' ? (
					<>
						<DialogHeader>
							<DialogTitle>Change subscription plan</DialogTitle>
							<DialogDescription>
								Choose a plan and billing interval for this tenant.
							</DialogDescription>
						</DialogHeader>

						{/* Billing interval toggle */}
						<div className="flex justify-center">
							<div className="inline-flex items-center rounded-lg border border-border bg-muted/40 p-1">
								{(['MONTHLY', 'ANNUAL'] as const).map((interval) => (
									<button
										key={interval}
										type="button"
										onClick={() => setBillingInterval(interval)}
										className={cn(
											'rounded-md px-5 py-1.5 text-sm font-medium transition-all',
											billingInterval === interval
												? 'bg-background text-foreground shadow-sm'
												: 'text-muted-foreground hover:text-foreground',
										)}
									>
										{interval === 'MONTHLY' ? 'Monthly' : 'Annual'}
									</button>
								))}
							</div>
						</div>

						{/* Plan list */}
						<RadioGroup
							value={selectedPlanId != null ? String(selectedPlanId) : ''}
							onValueChange={(v) => setSelectedPlanId(Number(v))}
							className="gap-2.5"
						>
							{plansLoading ? (
								Array.from({ length: 3 }).map((_, i) => (
									<Skeleton
										key={i}
										className="h-[72px] w-full rounded-lg"
									/>
								))
							) : plans.length === 0 ? (
								<p className="py-6 text-center text-sm text-muted-foreground">
									No active plans available.
								</p>
							) : (
								plans.map((plan) => {
									const selected = selectedPlanId === plan.id;
									const isCurrent = plan.id === currentTierId;
									const price = priceFor(plan);
									const savings =
										billingInterval === 'ANNUAL'
											? annualSavingsPct(plan)
											: null;

									return (
										<Label
											key={plan.id}
											className={cn(
												'flex cursor-pointer items-center justify-between rounded-lg border px-4 py-3.5 transition-colors',
												selected
													? 'border-primary bg-primary/5'
													: 'border-border hover:border-muted-foreground/40',
											)}
										>
											<RadioGroupItem
												value={String(plan.id)}
												className="sr-only"
											/>
											<div className="flex flex-col gap-0.5">
												<div className="flex items-center gap-2">
													<span className="text-sm font-semibold">
														{plan.name}
													</span>
													{isCurrent && (
														<span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
															Current
														</span>
													)}
													{savings != null && (
														<span className="rounded-full bg-tone-green-bg px-2 py-0.5 text-[11px] font-medium text-tone-green-fg">
															Save {savings}%
														</span>
													)}
												</div>
												<p className="text-xs text-muted-foreground">
													{planLimitLabel(plan)}
												</p>
											</div>
											<div className="flex items-center gap-3">
												<div className="text-right">
													<p className="text-sm font-semibold tabular-nums">
														{price === 0
															? 'Custom'
															: `${new Intl.NumberFormat('ru-RU').format(price)} UZS`}
													</p>
													{price > 0 && (
														<p className="text-xs text-muted-foreground">
															{priceSuffix}
														</p>
													)}
												</div>
												<div
													className={cn(
														'flex size-4 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
														selected
															? 'border-primary bg-primary'
															: 'border-muted-foreground/40',
													)}
												>
													{selected && (
														<div className="size-1.5 rounded-full bg-primary-foreground" />
													)}
												</div>
											</div>
										</Label>
									);
								})
							)}
						</RadioGroup>

						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => handleOpenChange(false)}
							>
								Cancel
							</Button>
							<Button
								disabled={
									selectedPlanId === null || plansLoading || isUnchanged
								}
								onClick={() => setStep('confirm')}
							>
								Continue
							</Button>
						</DialogFooter>
					</>
				) : (
					<>
						<DialogHeader>
							<DialogTitle>Confirm plan change</DialogTitle>
							<DialogDescription>
								Review the details before applying this change.
							</DialogDescription>
						</DialogHeader>

						<div className="flex flex-col gap-4">
							{/* From → To */}
							<div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 rounded-lg border border-border bg-muted/30 px-5 py-4">
								<div className="text-center">
									<p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
										From
									</p>
									<p className="text-sm font-semibold">
										{currentPlan?.name ?? 'No plan'}
									</p>
									<p className="mt-0.5 text-xs text-muted-foreground">
										{currentBillingInterval === 'ANNUAL'
											? 'Annual billing'
											: 'Monthly billing'}
									</p>
								</div>
								<div className="text-lg text-muted-foreground">→</div>
								<div className="text-center">
									<p className="mb-1 text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
										To
									</p>
									<p className="text-sm font-semibold text-primary">
										{selectedPlan?.name}
									</p>
									<p className="mt-0.5 text-xs text-muted-foreground">
										{billingInterval === 'ANNUAL'
											? 'Annual billing'
											: 'Monthly billing'}
									</p>
								</div>
							</div>

							{/* New charge */}
							{selectedPlan && (
								<div className="flex items-center justify-between rounded-lg border border-primary/20 bg-primary/5 px-4 py-3">
									<span className="text-sm text-muted-foreground">
										New charge
									</span>
									<span className="text-base font-bold tabular-nums">
										{priceFor(selectedPlan) === 0
											? 'Custom pricing'
											: `${new Intl.NumberFormat('ru-RU').format(priceFor(selectedPlan))} UZS${priceSuffix}`}
									</span>
								</div>
							)}

							<p className="text-xs text-muted-foreground">
								This change takes effect immediately. Billing adjustments
								will be prorated for the current period.
							</p>
						</div>

						{mutation.isError && (
							<p className="text-sm text-destructive">
								{mutation.error instanceof Error
									? mutation.error.message
									: 'Failed to apply the plan change. Please try again.'}
							</p>
						)}

						<DialogFooter>
							<Button
								variant="outline"
								onClick={() => setStep('select')}
								disabled={mutation.isPending}
							>
								Back
							</Button>
							<Button
								disabled={mutation.isPending}
								onClick={() => mutation.mutate()}
							>
								{mutation.isPending ? 'Applying…' : 'Confirm change'}
							</Button>
						</DialogFooter>
					</>
				)}
			</DialogContent>
		</Dialog>
	);
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ tenant }: { tenant: TenantDetailView }) {
	const { stats } = tenant;
	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<Card className="py-0">
					<CardContent className="px-5 py-4">
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<GraduationCap className="size-4" />
							<p className="text-xs">Active Students</p>
						</div>
						<p className="mt-2 text-2xl font-bold tabular-nums">
							{stats.activeStudents ?? 0}
						</p>
						<p className="text-xs text-muted-foreground">enrolled</p>
					</CardContent>
				</Card>
				<Card className="py-0">
					<CardContent className="px-5 py-4">
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<Users className="size-4" />
							<p className="text-xs">Active Staff</p>
						</div>
						<p className="mt-2 text-2xl font-bold tabular-nums">
							{stats.activeStaff ?? 0}
						</p>
						<p className="text-xs text-muted-foreground">teachers & admins</p>
					</CardContent>
				</Card>
				<Card className="py-0">
					<CardContent className="px-5 py-4">
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<MapPin className="size-4" />
							<p className="text-xs">Branches</p>
						</div>
						<p className="mt-2 text-2xl font-bold tabular-nums">
							{stats.branches}
						</p>
						<p className="text-xs text-muted-foreground">active</p>
					</CardContent>
				</Card>
				<Card className="py-0">
					<CardContent className="px-5 py-4">
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<Wallet className="size-4" />
							<p className="text-xs">Monthly Revenue</p>
						</div>
						<p className="mt-2 text-2xl font-bold tabular-nums">
							{(stats.monthlyRevenue ?? 0) === 0
								? '—'
								: new Intl.NumberFormat('ru-RU').format(
										stats.monthlyRevenue!,
									)}
						</p>
						<p className="text-xs text-muted-foreground">
							{stats.currency ?? tenant.defaultCurrency}
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<Card className="gap-0 py-0">
					<CardHeader className="border-b border-border px-5 py-4">
						<CardTitle className="text-sm font-semibold">About</CardTitle>
					</CardHeader>
					<CardContent className="px-5 py-4">
						<dl className="flex flex-col gap-3 text-sm">
							{[
								{ label: 'City', value: tenant.city ?? '—' },
								{ label: 'Country', value: 'Uzbekistan' },
								{ label: 'Timezone', value: tenant.timezone },
								{ label: 'Language', value: tenant.locale },
								{ label: 'Currency', value: tenant.defaultCurrency },
								...(tenant.phone
									? [{ label: 'Phone', value: tenant.phone }]
									: []),
							].map(({ label, value }) => (
								<div key={label} className="flex justify-between gap-4">
									<dt className="text-muted-foreground">{label}</dt>
									<dd className="text-right font-medium">{value}</dd>
								</div>
							))}
						</dl>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

// ─── Subscription tab ─────────────────────────────────────────────────────────

function SubscriptionTab({
	tenant,
	subscriptionTierId,
	onChangePlan,
}: {
	tenant: TenantDetailView;
	subscriptionTierId: number | null;
	onChangePlan: () => void;
}) {
	const { data: plansPage } = useQuery({
		queryKey: plansKeys.list({ isActive: true }),
		queryFn: () => listPlans({ isActive: true, limit: 100 }),
	});
	const plan = (plansPage?.rows ?? []).find((p) => p.id === subscriptionTierId) ?? null;

	const { subscription, stats } = tenant;

	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<Card className="gap-0 py-0">
					<CardHeader className="px-5 pt-5 pb-0">
						<p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
							Current Plan
						</p>
					</CardHeader>
					<CardContent className="flex flex-col gap-4 px-5 pt-3 pb-5">
						<div>
							<p className="text-2xl font-bold">{plan?.name ?? '—'}</p>
							{plan && (
								<p className="text-sm text-muted-foreground">
									{formatUzs(plan.priceMonthly)}/mo
								</p>
							)}
						</div>
						{subscription ? (
							<dl className="flex flex-col gap-2 text-sm">
								{[
									{
										label: 'Status',
										value: (
											<StatusBadge
												tone={
													SUB_STATUS_TONE[
														subscription.status
													] ?? 'slate'
												}
											>
												{SUB_STATUS_LABEL[subscription.status] ??
													subscription.status}
											</StatusBadge>
										),
									},
									{
										label: 'MRR',
										value: formatUzs(stats.monthlyRevenue),
									},
									{
										label: 'Period start',
										value: formatDate(
											subscription.currentPeriodStart,
										),
									},
									{
										label: 'Renews',
										value: formatDate(subscription.currentPeriodEnd),
									},
								].map(({ label, value }) => (
									<div
										key={label}
										className="flex items-center justify-between gap-4"
									>
										<dt className="text-muted-foreground">{label}</dt>
										<dd className="font-medium">{value}</dd>
									</div>
								))}
							</dl>
						) : (
							<p className="text-sm text-muted-foreground">
								No subscription on record.
							</p>
						)}
						<Button className="w-full" onClick={onChangePlan}>
							Change plan
						</Button>
					</CardContent>
				</Card>

				<Card className="gap-0 py-0">
					<CardHeader className="border-b border-border px-5 py-4">
						<CardTitle className="text-sm font-semibold">
							Recent Invoices
						</CardTitle>
					</CardHeader>
					<CardContent className="py-10 text-center text-sm text-muted-foreground">
						Invoice history coming soon.
					</CardContent>
				</Card>
			</div>

			<Card className="gap-0 py-0">
				<CardHeader className="border-b border-border px-5 py-4">
					<CardTitle className="text-sm font-semibold">Plan History</CardTitle>
				</CardHeader>
				<CardContent className="py-10 text-center text-sm text-muted-foreground">
					Plan history coming soon.
				</CardContent>
			</Card>
		</div>
	);
}

// ─── Branches tab ─────────────────────────────────────────────────────────────

function BranchesTab({ branches }: { branches: TenantBranchView[] }) {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-end">
				<Button size="sm" disabled>
					+ Add branch
				</Button>
			</div>
			<Card className="gap-0 overflow-hidden py-0">
				{branches.length === 0 ? (
					<div className="py-16 text-center text-sm text-muted-foreground">
						No branches found.
					</div>
				) : (
					<Table>
						<TableHeader>
							<TableRow>
								<TableHead>Branch</TableHead>
								<TableHead>Code</TableHead>
								<TableHead>Contact</TableHead>
								<TableHead>Status</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{branches.map((branch) => (
								<TableRow key={branch.id}>
									<TableCell>
										<div className="flex items-center gap-1.5">
											<span className="font-medium">
												{branch.name}
											</span>
											{branch.isMain && (
												<span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
													Main
												</span>
											)}
										</div>
										{branch.address && (
											<p className="text-xs text-muted-foreground">
												{branch.address}
											</p>
										)}
									</TableCell>
									<TableCell className="font-mono text-sm text-muted-foreground">
										{branch.code}
									</TableCell>
									<TableCell className="text-sm text-muted-foreground">
										{branch.phone ?? branch.email ?? '—'}
									</TableCell>
									<TableCell>
										<StatusBadge
											tone={branch.isActive ? 'green' : 'slate'}
										>
											{branch.isActive ? 'Active' : 'Inactive'}
										</StatusBadge>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>
				)}
			</Card>
		</div>
	);
}

// ─── Members tab ──────────────────────────────────────────────────────────────

function MembersTab({ members }: { members: TenantMemberView[] }) {
	return (
		<Card className="gap-0 overflow-hidden py-0">
			{members.length === 0 ? (
				<div className="py-16 text-center text-sm text-muted-foreground">
					No members found.
				</div>
			) : (
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>User</TableHead>
							<TableHead>Contact</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Last login</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{members.map((member) => (
							<TableRow key={member.userId}>
								<TableCell>
									<div className="flex items-center gap-2.5">
										<Avatar className="size-7 shrink-0">
											<AvatarFallback
												className={cn(
													'text-xs font-semibold',
													avatarClass(member.user.id),
												)}
											>
												{getInitials(
													`${member.user.firstName} ${member.user.lastName}`,
												)}
											</AvatarFallback>
										</Avatar>
										<span className="font-medium">
											{member.user.firstName} {member.user.lastName}
										</span>
									</div>
								</TableCell>
								<TableCell className="text-sm text-muted-foreground">
									{member.user.phone}
									{member.user.email && (
										<span className="ml-1 text-xs">
											· {member.user.email}
										</span>
									)}
								</TableCell>
								<TableCell>
									<StatusBadge
										tone={
											MEMBER_STATUS_TONE[member.status] ?? 'slate'
										}
									>
										{MEMBER_STATUS_LABEL[member.status] ??
											member.status}
									</StatusBadge>
								</TableCell>
								<TableCell className="text-sm text-muted-foreground">
									{member.user.lastLoginAt
										? formatDate(member.user.lastLoginAt)
										: '—'}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			)}
		</Card>
	);
}

// ─── Audit tab ────────────────────────────────────────────────────────────────

function AuditTab() {
	return (
		<Card>
			<CardContent className="py-12 text-center text-sm text-muted-foreground">
				Per-tenant audit log coming soon.
			</CardContent>
		</Card>
	);
}

// ─── Settings tab ─────────────────────────────────────────────────────────────

function SettingsTab({
	tenant,
	onSave,
	saving,
}: {
	tenant: TenantDetailView;
	onSave: (data: UpdateTenantInput) => void;
	saving: boolean;
}) {
	const [timezone, setTimezone] = useState(tenant.timezone);
	const [locale, setLocale] = useState(tenant.locale);
	const [phone, setPhone] = useState(tenant.phone ?? '');
	const [city, setCity] = useState(tenant.city ?? '');

	return (
		<div className="flex max-w-lg flex-col gap-6">
			<Card className="gap-0 py-0">
				<CardHeader className="border-b border-border px-5 py-4">
					<CardTitle className="text-sm font-semibold">General</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4 px-5 py-5">
					<div className="flex flex-col gap-1.5">
						<Label>Display name</Label>
						<Input value={tenant.name} disabled />
						<p className="text-xs text-muted-foreground">
							Tenant name cannot be changed from the platform console.
						</p>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="settings-phone">Phone</Label>
						<Input
							id="settings-phone"
							type="tel"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							placeholder="+998 90 000 00 00"
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="settings-city">City</Label>
						<Input
							id="settings-city"
							value={city}
							onChange={(e) => setCity(e.target.value)}
							placeholder="Tashkent"
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label>Timezone</Label>
						<Select value={timezone} onValueChange={setTimezone}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="Asia/Tashkent">
									Asia/Tashkent (UTC+5)
								</SelectItem>
								<SelectItem value="Europe/Moscow">
									Europe/Moscow (UTC+3)
								</SelectItem>
								<SelectItem value="UTC">UTC</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label>Language</Label>
						<Select value={locale} onValueChange={setLocale}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="uz">Uzbek (Latin)</SelectItem>
								<SelectItem value="ru">Russian</SelectItem>
								<SelectItem value="en">English</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="pt-1">
						<Button
							disabled={saving}
							onClick={() =>
								onSave({
									timezone,
									locale,
									phone: phone || null,
									city: city || null,
								})
							}
						>
							{saving ? 'Saving…' : 'Save changes'}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// ─── Danger zone tab ──────────────────────────────────────────────────────────

function DangerZoneTab({
	status,
	onSuspend,
	onUnsuspend,
	onCancel,
}: {
	status: TenantStatus;
	onSuspend: () => void;
	onUnsuspend: () => void;
	onCancel: () => void;
}) {
	return (
		<div className="flex max-w-lg flex-col gap-4">
			{status === 'SUSPENDED' ? (
				<div className="flex items-start justify-between gap-4 rounded-lg border border-green-500/40 bg-green-500/5 px-5 py-4">
					<div className="flex-1">
						<p className="flex items-center gap-1.5 text-sm font-semibold text-green-600 dark:text-green-400">
							<PlayCircle className="size-4" />
							Unsuspend tenant
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							Restores access for all staff, teachers, students and parents.
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="shrink-0 border-green-500 text-green-600 hover:bg-green-500/10 dark:text-green-400"
						onClick={onUnsuspend}
					>
						Unsuspend
					</Button>
				</div>
			) : (
				<div className="flex items-start justify-between gap-4 rounded-lg border border-amber-500/40 bg-amber-500/5 px-5 py-4">
					<div className="flex-1">
						<p className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400">
							<PauseCircle className="size-4" />
							Suspend tenant
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							Immediately locks out all staff, teachers, students and
							parents. Data is retained. This is reversible — you can
							reactivate at any time.
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="shrink-0 border-amber-500 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
						onClick={onSuspend}
					>
						Suspend
					</Button>
				</div>
			)}

			<div className="flex items-start justify-between gap-4 rounded-lg border border-destructive/40 bg-destructive/5 px-5 py-4">
				<div className="flex-1">
					<p className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
						<Ban className="size-4" />
						Cancel subscription
					</p>
					<p className="mt-1 text-xs text-muted-foreground">
						Terminates the subscription and schedules tenant data for deletion
						after 30 days. This is <strong>permanent</strong> and cannot be
						undone from the console.
					</p>
				</div>
				<Button
					variant="destructive"
					size="sm"
					className="shrink-0"
					onClick={onCancel}
				>
					Cancel subscription
				</Button>
			</div>
		</div>
	);
}

// ─── Tab trigger style ────────────────────────────────────────────────────────

const TAB_TRIGGER_CLASS = cn(
	'cursor-pointer -mb-px rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2',
	'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
	'data-[state=active]:border-b-primary data-[state=active]:bg-transparent',
	'data-[state=active]:text-primary data-[state=active]:shadow-none',
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export function TenantDetailPage() {
	const { tenantId } = useParams({ strict: false }) as { tenantId?: string };
	const numericId = tenantId ? parseInt(tenantId, 10) : NaN;
	const isValidId = !isNaN(numericId);

	const queryClient = useQueryClient();

	const {
		data: tenant,
		isLoading,
		isError,
	} = useQuery({
		queryKey: tenantsKeys.detail(numericId),
		queryFn: () => getTenant(numericId),
		enabled: isValidId,
	});

	const suspendMutation = useMutation({
		mutationFn: (reason?: string) => suspendTenant(numericId, { reason }),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: tenantsKeys.detail(numericId),
			});
			setSuspendOpen(false);
		},
	});

	const unsuspendMutation = useMutation({
		mutationFn: (reason?: string) => unsuspendTenant(numericId, { reason }),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: tenantsKeys.detail(numericId),
			});
			setUnsuspendOpen(false);
		},
	});

	const cancelMutation = useMutation({
		mutationFn: (reason?: string) => cancelTenant(numericId, { reason }),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: tenantsKeys.detail(numericId),
			});
			setCancelOpen(false);
		},
	});

	const updateMutation = useMutation({
		mutationFn: (data: UpdateTenantInput) => updateTenant(numericId, data),
		onSuccess: () => {
			void queryClient.invalidateQueries({
				queryKey: tenantsKeys.detail(numericId),
			});
		},
	});

	const [suspendOpen, setSuspendOpen] = useState(false);
	const [unsuspendOpen, setUnsuspendOpen] = useState(false);
	const [cancelOpen, setCancelOpen] = useState(false);
	const [changePlanOpen, setChangePlanOpen] = useState(false);

	if (!isValidId || isError) {
		return (
			<div className="flex flex-col items-center gap-4 py-24 text-center">
				<p className="text-muted-foreground">Tenant not found.</p>
				<Link to="/tenants">
					<Button variant="outline">← All tenants</Button>
				</Link>
			</div>
		);
	}

	if (isLoading || !tenant) {
		return (
			<div className="flex flex-col gap-6">
				<Skeleton className="h-4 w-24" />
				<Skeleton className="h-16 w-full" />
				<Skeleton className="h-96 w-full" />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<Link
				to="/tenants"
				className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				← All tenants
			</Link>

			{/* Context band */}
			<div className="flex flex-wrap items-start justify-between gap-4">
				<div className="flex items-start gap-4">
					<Avatar className="size-12 shrink-0">
						<AvatarFallback
							className={cn('text-sm font-bold', avatarClass(tenant.id))}
						>
							{getInitials(tenant.name)}
						</AvatarFallback>
					</Avatar>
					<div className="flex flex-col gap-1">
						<div className="flex flex-wrap items-center gap-2">
							<h1 className="text-xl font-bold leading-tight">
								{tenant.name}
							</h1>
							<StatusBadge kind="tenant" status={tenant.status} />
						</div>
						<div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
							<span className="flex items-center gap-1">
								<Globe className="size-3.5" />
								{tenant.subdomain}.educore.uz
							</span>
						</div>
					</div>
				</div>

				<Button variant="outline" size="sm" className="gap-1.5" disabled>
					<Eye className="size-4" />
					Impersonate
				</Button>
			</div>

			{/* Tabs */}
			<Tabs defaultValue="overview" className="gap-0">
				<TabsList className="h-auto w-full justify-start rounded-none border-b border-border bg-transparent p-0">
					<TabsTrigger value="overview" className={TAB_TRIGGER_CLASS}>
						Overview
					</TabsTrigger>
					<TabsTrigger value="subscription" className={TAB_TRIGGER_CLASS}>
						Subscription
					</TabsTrigger>
					<TabsTrigger value="branches" className={TAB_TRIGGER_CLASS}>
						Branches
					</TabsTrigger>
					<TabsTrigger value="members" className={TAB_TRIGGER_CLASS}>
						Members
					</TabsTrigger>
					<TabsTrigger value="settings" className={TAB_TRIGGER_CLASS}>
						Settings
					</TabsTrigger>
					<TabsTrigger value="audit" className={TAB_TRIGGER_CLASS}>
						Audit
					</TabsTrigger>
					<TabsTrigger
						value="danger"
						className={cn(
							TAB_TRIGGER_CLASS,
							'text-destructive data-[state=active]:border-b-destructive data-[state=active]:text-destructive',
						)}
					>
						Danger zone
						<span className="ml-1 size-1.5 rounded-full bg-destructive" />
					</TabsTrigger>
				</TabsList>

				<div className="mt-6">
					<TabsContent value="overview">
						<OverviewTab tenant={tenant} />
					</TabsContent>
					<TabsContent value="subscription">
						<SubscriptionTab
							tenant={tenant}
							subscriptionTierId={tenant.subscriptionTierId}
							onChangePlan={() => setChangePlanOpen(true)}
						/>
					</TabsContent>
					<TabsContent value="branches">
						<BranchesTab branches={tenant.branches ?? []} />
					</TabsContent>
					<TabsContent value="members">
						<MembersTab members={tenant.members ?? []} />
					</TabsContent>
					<TabsContent value="settings">
						<SettingsTab
							tenant={tenant}
							onSave={(data) => updateMutation.mutate(data)}
							saving={updateMutation.isPending}
						/>
					</TabsContent>
					<TabsContent value="audit">
						<AuditTab />
					</TabsContent>
					<TabsContent value="danger">
						<DangerZoneTab
							status={tenant.status}
							onSuspend={() => setSuspendOpen(true)}
							onUnsuspend={() => setUnsuspendOpen(true)}
							onCancel={() => setCancelOpen(true)}
						/>
					</TabsContent>
				</div>
			</Tabs>

			{/* Change plan dialog */}
			<ChangePlanDialog
				open={changePlanOpen}
				onOpenChange={setChangePlanOpen}
				tenantId={numericId}
				currentTierId={tenant.subscriptionTierId}
				currentBillingInterval={tenant.subscription?.billingInterval ?? null}
			/>

			{/* Suspend confirm */}
			<TypeToConfirmDialog
				open={suspendOpen}
				onOpenChange={setSuspendOpen}
				title="Suspend tenant"
				description="This will immediately lock out all staff, teachers, students and parents. You can reactivate at any time."
				confirmLabel="Suspend tenant"
				tenantName={tenant.name}
				loading={suspendMutation.isPending}
				onConfirm={() => suspendMutation.mutate(undefined)}
			/>

			{/* Unsuspend confirm */}
			<TypeToConfirmDialog
				open={unsuspendOpen}
				onOpenChange={setUnsuspendOpen}
				title="Unsuspend tenant"
				description="This will restore access for all staff, teachers, students and parents."
				confirmLabel="Unsuspend tenant"
				tenantName={tenant.name}
				loading={unsuspendMutation.isPending}
				onConfirm={() => unsuspendMutation.mutate(undefined)}
			/>

			{/* Cancel account confirm */}
			<TypeToConfirmDialog
				open={cancelOpen}
				onOpenChange={setCancelOpen}
				title="Cancel account"
				description="This will terminate the subscription and schedule all tenant data for deletion after 30 days. This action is permanent and cannot be undone."
				confirmLabel="Cancel account"
				tenantName={tenant.name}
				loading={cancelMutation.isPending}
				onConfirm={() => cancelMutation.mutate(undefined)}
				variant="destructive"
			/>
		</div>
	);
}
