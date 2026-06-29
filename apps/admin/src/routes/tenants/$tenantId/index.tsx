// TODO: replace with useQuery(tenantDetailQuery(tenantId)) once GET /admin/tenants/:id is ready.

import React, { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import {
	Ban,
	Building2,
	Calendar,
	CreditCard,
	Download,
	Eye,
	FileText,
	Globe,
	GraduationCap,
	MapPin,
	PauseCircle,
	Settings as SettingsIcon,
	UserPlus,
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
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Separator,
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

import { MOCK_TENANTS } from '../_mock';
import type { MockTenantRow, PlanId } from '../_mock';

// ─── Constants ────────────────────────────────────────────────────────────────

const PLAN_LABELS: Record<PlanId, string> = {
	starter: 'Starter',
	growth: 'Growth',
	enterprise: 'Enterprise',
};

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

const ROLE_TONES: Record<string, StatusTone> = {
	OWNER: 'violet',
	ADMIN: 'blue',
	MANAGER: 'cyan',
	TEACHER: 'slate',
};

const UZ_CITIES = [
	'Tashkent',
	'Samarkand',
	'Bukhara',
	'Namangan',
	'Andijan',
	'Fergana',
	'Nukus',
	'Urgench',
];

const BRANCH_NAMES = [
	'Main Campus',
	'Chilanzar Branch',
	'Yunusobod Branch',
	'Mirzo Ulugbek Branch',
	'Sergeli Branch',
	'Samarkand Branch',
	'Bukhara Branch',
	'Namangan Branch',
];

const PLAN_BASE_PRICES: Record<PlanId, number> = {
	starter: 1_200_000,
	growth: 2_400_000,
	enterprise: 6_000_000,
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

function avatarClass(id: string): string {
	const idx = MOCK_TENANTS.findIndex((t) => t.id === id);
	return AVATAR_PALETTE[(idx >= 0 ? idx : 0) % AVATAR_PALETTE.length];
}

function formatUZS(amount: number): string {
	return new Intl.NumberFormat('ru-RU').format(amount) + ' UZS';
}

function formatDate(iso: string): string {
	return new Intl.DateTimeFormat('en-GB', {
		day: '2-digit',
		month: 'short',
		year: 'numeric',
	}).format(new Date(iso));
}

// ─── Mock detail types & builder ──────────────────────────────────────────────

type MockBranch = {
	id: string;
	name: string;
	city: string;
	students: number;
	staff: number;
	status: 'active' | 'inactive';
	createdAt: string;
};

type MockUser = {
	id: string;
	name: string;
	email: string;
	role: string;
	status: 'active' | 'cancelled';
	lastLoginAt: string | null;
};

type InvoiceStatus = 'paid' | 'open' | 'overdue';

type MockInvoice = {
	id: string;
	period: string;
	amount: number;
	status: InvoiceStatus;
};

type AuditResourceKind = 'settings' | 'branch' | 'invoice' | 'subscription';

type MockAuditEvent = {
	id: string;
	actor: string;
	action: string;
	resource: AuditResourceKind;
	ip: string;
	time: string;
};

type TenantDetail = {
	city: string;
	contactEmail: string;
	staffCount: number;
	branches: MockBranch[];
	users: MockUser[];
	subscription: {
		pricePerMonth: number;
		billingCycle: string;
		renewsAt: string;
		subscriptionStatus: string;
		invoices: MockInvoice[];
		history: Array<{ date: string; from: string; to: string }>;
	};
	activity: Array<{ id: string; text: string; time: string }>;
	auditEvents: MockAuditEvent[];
};

function buildDetail(tenant: MockTenantRow): TenantDetail {
	const idx = MOCK_TENANTS.indexOf(tenant);
	const city = UZ_CITIES[idx % UZ_CITIES.length];
	const price = PLAN_BASE_PRICES[tenant.plan];

	const branches: MockBranch[] = Array.from({ length: tenant.branches }, (_, i) => ({
		id: `${tenant.id}-br-${i + 1}`,
		name: BRANCH_NAMES[i % BRANCH_NAMES.length],
		city: UZ_CITIES[(idx + i) % UZ_CITIES.length],
		students: Math.floor(tenant.students / Math.max(1, tenant.branches)),
		staff: Math.max(3, Math.ceil(12 / Math.max(1, tenant.branches))),
		status: 'active' as const,
		createdAt: tenant.joinedAt,
	}));

	const users: MockUser[] = [
		{
			id: `${tenant.id}-u1`,
			name: 'Aziz Yusupov',
			email: `aziz@${tenant.subdomain}.uz`,
			role: 'OWNER',
			status: 'active',
			lastLoginAt: '2026-06-29T07:00:00Z',
		},
		{
			id: `${tenant.id}-u2`,
			name: 'Dilnoza Karimova',
			email: `dilnoza@${tenant.subdomain}.uz`,
			role: 'ADMIN',
			status: 'active',
			lastLoginAt: '2026-06-28T15:30:00Z',
		},
		{
			id: `${tenant.id}-u3`,
			name: 'Jasur Rakhimov',
			email: `jasur@${tenant.subdomain}.uz`,
			role: 'MANAGER',
			status: 'active',
			lastLoginAt: '2026-06-27T10:15:00Z',
		},
		{
			id: `${tenant.id}-u4`,
			name: 'Nodira Saidova',
			email: `nodira@${tenant.subdomain}.uz`,
			role: 'TEACHER',
			status: 'active',
			lastLoginAt: '2026-06-26T08:45:00Z',
		},
		{
			id: `${tenant.id}-u5`,
			name: 'Bekzod Tursunov',
			email: `bekzod@${tenant.subdomain}.uz`,
			role: 'TEACHER',
			status: 'cancelled',
			lastLoginAt: null,
		},
	];

	return {
		city,
		contactEmail: `info@${tenant.subdomain}.uz`,
		staffCount: Math.max(5, Math.floor(tenant.students / 20)),
		branches,
		users,
		subscription: {
			pricePerMonth: price,
			billingCycle: 'Monthly',
			renewsAt: '01 Jul 2026',
			subscriptionStatus: tenant.status === 'active' ? 'Active' : 'Inactive',
			invoices: [
				{
					id: 'INV-2026-0612',
					period: '01 Jun 2026',
					amount: price,
					status: 'open',
				},
				{
					id: 'INV-2026-0511',
					period: '01 May 2026',
					amount: price,
					status: 'paid',
				},
				{
					id: 'INV-2026-0410',
					period: '01 Apr 2026',
					amount: price,
					status: 'paid',
				},
			],
			history: [
				{ date: 'Jan 2025', from: 'Starter', to: PLAN_LABELS[tenant.plan] },
			],
		},
		activity: [
			{ id: 'a1', text: `Payment of ${formatUZS(price)} recorded`, time: '2h ago' },
			{ id: 'a2', text: '42 new students enrolled this week', time: 'Yesterday' },
			{ id: 'a3', text: 'Owner updated branding settings', time: '3 days ago' },
			{ id: 'a4', text: 'New branch "Yunusobod" created', time: '1 week ago' },
			{
				id: 'a5',
				text: `Plan changed to ${PLAN_LABELS[tenant.plan]}`,
				time: '2 weeks ago',
			},
		],
		auditEvents: [
			{
				id: 'ev1',
				actor: 'Aziz Yusupov',
				action: 'updated payment settings',
				resource: 'settings',
				ip: '213.230.64.12',
				time: '2h ago',
			},
			{
				id: 'ev2',
				actor: 'Aziz Yusupov',
				action: 'created branch "Yunusobod"',
				resource: 'branch',
				ip: '213.230.64.12',
				time: '1d ago',
			},
			{
				id: 'ev3',
				actor: 'Dilnoza Karimova',
				action: 'voided invoice INV-2026-0418',
				resource: 'invoice',
				ip: '84.54.92.7',
				time: '3d ago',
			},
			{
				id: 'ev4',
				actor: `S. Alimov (Platform)`,
				action: `changed plan to ${PLAN_LABELS[tenant.plan]}`,
				resource: 'subscription',
				ip: '10.0.0.4',
				time: '2w ago',
			},
		],
	};
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
						disabled={value !== tenantName}
						onClick={() => {
							onConfirm();
							handleOpenChange(false);
						}}
					>
						{confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({
	tenant,
	detail,
}: {
	tenant: MockTenantRow;
	detail: TenantDetail;
}) {
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
							{tenant.students.toLocaleString('ru-RU')}
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
							{detail.staffCount}
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
							{tenant.branches}
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
							{tenant.mrr === 0
								? '—'
								: new Intl.NumberFormat('ru-RU').format(tenant.mrr)}
						</p>
						<p className="text-xs text-muted-foreground">UZS</p>
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
								{ label: 'Founded', value: formatDate(tenant.joinedAt) },
								{ label: 'City', value: detail.city },
								{ label: 'Country', value: 'Uzbekistan' },
								{ label: 'Timezone', value: 'Asia/Tashkent (UTC+5)' },
								{ label: 'Language', value: 'Uzbek (Latin)' },
								{ label: 'Contact email', value: detail.contactEmail },
							].map(({ label, value }) => (
								<div key={label} className="flex justify-between gap-4">
									<dt className="text-muted-foreground">{label}</dt>
									<dd className="text-right font-medium">{value}</dd>
								</div>
							))}
						</dl>
					</CardContent>
				</Card>

				<Card className="gap-0 py-0">
					<CardHeader className="border-b border-border px-5 py-4">
						<CardTitle className="text-sm font-semibold">
							Recent Activity
						</CardTitle>
					</CardHeader>
					<CardContent className="px-0 py-0">
						<ul>
							{detail.activity.map((event, i) => (
								<li key={event.id}>
									{i > 0 && <Separator />}
									<div className="flex items-start justify-between gap-4 px-5 py-3">
										<p className="text-sm">{event.text}</p>
										<span className="shrink-0 text-xs text-muted-foreground">
											{event.time}
										</span>
									</div>
								</li>
							))}
						</ul>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}

// ─── Subscription tab ─────────────────────────────────────────────────────────

function invoiceStatusTone(status: InvoiceStatus): StatusTone {
	const map: Record<InvoiceStatus, StatusTone> = {
		paid: 'green',
		open: 'cyan',
		overdue: 'red',
	};
	return map[status] ?? 'slate';
}

function invoiceStatusLabel(status: InvoiceStatus): string {
	const map: Record<InvoiceStatus, string> = {
		paid: 'Paid',
		open: 'Active',
		overdue: 'Overdue',
	};
	return map[status] ?? status;
}

function SubscriptionTab({
	tenant,
	detail,
	onChangePlan,
}: {
	tenant: MockTenantRow;
	detail: TenantDetail;
	onChangePlan: () => void;
}) {
	const { subscription } = detail;

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
							<p className="text-2xl font-bold">
								{PLAN_LABELS[tenant.plan]}
							</p>
							<p className="text-sm text-muted-foreground">
								{formatUZS(subscription.pricePerMonth)}/mo
							</p>
						</div>
						<dl className="flex flex-col gap-2 text-sm">
							{[
								{
									label: 'Status',
									value: (
										<StatusBadge
											tone={
												tenant.status === 'active'
													? 'green'
													: 'amber'
											}
										>
											{subscription.subscriptionStatus}
										</StatusBadge>
									),
								},
								{
									label: 'MRR',
									value: formatUZS(
										tenant.mrr || subscription.pricePerMonth,
									),
								},
								{
									label: 'Billing cycle',
									value: subscription.billingCycle,
								},
								{ label: 'Renews', value: subscription.renewsAt },
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
					<CardContent className="px-0 py-0">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead>Invoice</TableHead>
									<TableHead className="text-right">Amount</TableHead>
									<TableHead>Status</TableHead>
									<TableHead className="w-10" />
								</TableRow>
							</TableHeader>
							<TableBody>
								{subscription.invoices.map((inv) => (
									<TableRow key={inv.id}>
										<TableCell>
											<p className="text-sm font-medium">
												{inv.id}
											</p>
											<p className="text-xs text-muted-foreground">
												{inv.period}
											</p>
										</TableCell>
										<TableCell className="text-right tabular-nums text-sm">
											{new Intl.NumberFormat('ru-RU').format(
												inv.amount,
											)}{' '}
											UZS
										</TableCell>
										<TableCell>
											<StatusBadge
												tone={invoiceStatusTone(inv.status)}
											>
												{invoiceStatusLabel(inv.status)}
											</StatusBadge>
										</TableCell>
										<TableCell>
											<Button
												variant="ghost"
												size="icon"
												className="size-7 text-muted-foreground"
											>
												<Download className="size-3.5" />
												<span className="sr-only">Download</span>
											</Button>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</CardContent>
				</Card>
			</div>

			<Card className="gap-0 py-0">
				<CardHeader className="border-b border-border px-5 py-4">
					<CardTitle className="text-sm font-semibold">Plan History</CardTitle>
				</CardHeader>
				<CardContent className="px-5 py-4">
					<ul className="flex flex-col gap-3">
						{subscription.history.map((h, i) => (
							<li key={i} className="flex items-center gap-2 text-sm">
								<span className="text-muted-foreground">{h.date}</span>
								<span className="text-muted-foreground">·</span>
								<span>
									Changed from <strong>{h.from}</strong> to{' '}
									<strong>{h.to}</strong>
								</span>
							</li>
						))}
					</ul>
				</CardContent>
			</Card>
		</div>
	);
}

// ─── Branches tab ─────────────────────────────────────────────────────────────

function BranchesTab({ detail }: { detail: TenantDetail }) {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-end">
				{/* TODO: open add-branch modal once POST /admin/branches is ready */}
				<Button size="sm" disabled>
					+ Add branch
				</Button>
			</div>
			<Card className="gap-0 overflow-hidden py-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Branch</TableHead>
							<TableHead>City</TableHead>
							<TableHead className="text-right">Students</TableHead>
							<TableHead className="text-right">Staff</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Created</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{detail.branches.map((branch) => (
							// TODO: link to /tenants/:id/branches/:branchId once stub route is added
							<TableRow key={branch.id}>
								<TableCell className="font-medium">
									{branch.name}
								</TableCell>
								<TableCell className="text-muted-foreground">
									{branch.city}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{branch.students.toLocaleString('ru-RU')}
								</TableCell>
								<TableCell className="text-right tabular-nums">
									{branch.staff}
								</TableCell>
								<TableCell>
									<StatusBadge tone="green">Active</StatusBadge>
								</TableCell>
								<TableCell className="text-sm text-muted-foreground">
									{formatDate(branch.createdAt)}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Card>
		</div>
	);
}

// ─── Members tab ────────────────────────────────────────────────────────────────

function MembersTab({
	detail,
	onInvite,
}: {
	detail: TenantDetail;
	onInvite: () => void;
}) {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-end">
				<Button size="sm" onClick={onInvite}>
					<UserPlus className="size-4" />
					Invite user
				</Button>
			</div>
			<Card className="gap-0 overflow-hidden py-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>Name</TableHead>
							<TableHead>Email</TableHead>
							<TableHead>Role</TableHead>
							<TableHead>Status</TableHead>
							<TableHead>Last login</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{detail.users.map((user) => (
							<TableRow key={user.id}>
								<TableCell>
									<div className="flex items-center gap-2">
										<Avatar className="size-7">
											<AvatarFallback className="bg-tone-slate-bg text-tone-slate-fg text-xs font-semibold">
												{getInitials(user.name)}
											</AvatarFallback>
										</Avatar>
										<span className="text-sm font-medium">
											{user.name}
										</span>
									</div>
								</TableCell>
								<TableCell className="text-sm text-muted-foreground">
									{user.email}
								</TableCell>
								<TableCell>
									<StatusBadge tone={ROLE_TONES[user.role] ?? 'slate'}>
										{user.role}
									</StatusBadge>
								</TableCell>
								<TableCell>
									<StatusBadge
										tone={user.status === 'active' ? 'green' : 'red'}
									>
										{user.status === 'active'
											? 'Active'
											: 'Cancelled'}
									</StatusBadge>
								</TableCell>
								<TableCell className="text-sm text-muted-foreground">
									{user.lastLoginAt
										? formatDate(user.lastLoginAt)
										: '—'}
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</Card>
		</div>
	);
}

// ─── Audit tab ────────────────────────────────────────────────────────────────

const AUDIT_RESOURCE_META: Record<
	AuditResourceKind,
	{ label: string; icon: React.ElementType; iconClass: string }
> = {
	settings: {
		label: 'Settings',
		icon: SettingsIcon,
		iconClass: 'bg-tone-slate-bg text-tone-slate-fg',
	},
	branch: {
		label: 'Branch',
		icon: Building2,
		iconClass: 'bg-tone-green-bg text-tone-green-fg',
	},
	invoice: {
		label: 'Invoice',
		icon: FileText,
		iconClass: 'bg-tone-amber-bg text-tone-amber-fg',
	},
	subscription: {
		label: 'Subscription',
		icon: CreditCard,
		iconClass: 'bg-tone-blue-bg text-tone-blue-fg',
	},
};

function AuditTab({ detail }: { detail: TenantDetail }) {
	return (
		<Card className="gap-0 py-0">
			<ul>
				{detail.auditEvents.map((event, i) => {
					const meta = AUDIT_RESOURCE_META[event.resource];
					const Icon = meta.icon;
					return (
						<li key={event.id}>
							{i > 0 && <Separator />}
							<div className="flex items-center gap-4 px-5 py-4">
								<span
									className={cn(
										'flex size-8 shrink-0 items-center justify-center rounded-lg',
										meta.iconClass,
									)}
								>
									<Icon className="size-4" />
								</span>
								<div className="min-w-0 flex-1">
									<p className="text-sm">
										<strong>{event.actor}</strong> {event.action}
									</p>
									<p className="mt-0.5 text-xs text-muted-foreground">
										{meta.label} · {event.ip}
									</p>
								</div>
								<span className="shrink-0 text-xs text-muted-foreground">
									{event.time}
								</span>
							</div>
						</li>
					);
				})}
			</ul>
		</Card>
	);
}

// ─── Danger zone tab ──────────────────────────────────────────────────────────

function DangerZoneTab({
	onSuspend,
	onCancel,
}: {
	onSuspend: () => void;
	onCancel: () => void;
}) {
	return (
		<div className="flex max-w-lg flex-col gap-4">
			<div className="flex items-start justify-between gap-4 rounded-lg border border-amber-500/40 bg-amber-500/5 px-5 py-4">
				<div className="flex-1">
					<p className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400">
						<PauseCircle className="size-4" />
						Suspend tenant
					</p>
					<p className="mt-1 text-xs text-muted-foreground">
						Immediately locks out all staff, teachers, students and parents.
						Data is retained. This is reversible — you can reactivate at any
						time.
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

// ─── Settings tab ─────────────────────────────────────────────────────────────

function SettingsTab({
	tenant,
	detail,
}: {
	tenant: MockTenantRow;
	detail: TenantDetail;
}) {
	const [displayName, setDisplayName] = useState(tenant.name);
	const [contactEmail, setContactEmail] = useState(detail.contactEmail);
	const [timezone, setTimezone] = useState('Asia/Tashkent');
	const [language, setLanguage] = useState('uz');

	return (
		<div className="flex max-w-lg flex-col gap-6">
			<Card className="gap-0 py-0">
				<CardHeader className="border-b border-border px-5 py-4">
					<CardTitle className="text-sm font-semibold">General</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4 px-5 py-5">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="display-name">Display name</Label>
						<Input
							id="display-name"
							value={displayName}
							onChange={(e) => setDisplayName(e.target.value)}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="contact-email">Contact email</Label>
						<Input
							id="contact-email"
							type="email"
							value={contactEmail}
							onChange={(e) => setContactEmail(e.target.value)}
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
						<Select value={language} onValueChange={setLanguage}>
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
						{/* TODO: wire to PATCH /admin/tenants/:id once mutation is ready */}
						<Button disabled>Save changes</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}

// ─── Tab trigger style ────────────────────────────────────────────────────────

const TAB_TRIGGER_CLASS = cn(
	'-mb-px rounded-none border-b-2 border-transparent px-4 pb-3 pt-2',
	'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
	'data-[state=active]:border-primary data-[state=active]:bg-transparent',
	'data-[state=active]:text-foreground data-[state=active]:shadow-none',
);

// ─── Page ─────────────────────────────────────────────────────────────────────

export function TenantDetailPage() {
	const { tenantId } = useParams({ strict: false }) as { tenantId?: string };
	const tenant = MOCK_TENANTS.find((t) => t.id === tenantId) ?? null;

	const [suspendOpen, setSuspendOpen] = useState(false);
	const [cancelOpen, setCancelOpen] = useState(false);
	const [changePlanOpen, setChangePlanOpen] = useState(false);
	const [inviteOpen, setInviteOpen] = useState(false);

	if (!tenant) {
		return (
			<div className="flex flex-col items-center gap-4 py-24 text-center">
				<p className="text-muted-foreground">Tenant not found.</p>
				<Link to="/tenants">
					<Button variant="outline">← All tenants</Button>
				</Link>
			</div>
		);
	}

	const detail = buildDetail(tenant);

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
							<span className="flex items-center gap-1">
								<Calendar className="size-3.5" />
								{PLAN_LABELS[tenant.plan]} plan
							</span>
							<span>Since {formatDate(tenant.joinedAt)}</span>
						</div>
					</div>
				</div>

				<Button variant="outline" size="sm" className="gap-1.5">
					<Eye className="size-4" />
					Impersonate
				</Button>
			</div>

			{/* Tab navigation + content */}
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
							'text-destructive data-[state=active]:border-destructive data-[state=active]:text-destructive',
						)}
					>
						Danger zone
						<span className="ml-1 size-1.5 rounded-full bg-destructive" />
					</TabsTrigger>
				</TabsList>

				<div className="mt-6">
					<TabsContent value="overview">
						<OverviewTab tenant={tenant} detail={detail} />
					</TabsContent>
					<TabsContent value="subscription">
						<SubscriptionTab
							tenant={tenant}
							detail={detail}
							onChangePlan={() => setChangePlanOpen(true)}
						/>
					</TabsContent>
					<TabsContent value="branches">
						<BranchesTab detail={detail} />
					</TabsContent>
					<TabsContent value="members">
						<MembersTab
							detail={detail}
							onInvite={() => setInviteOpen(true)}
						/>
					</TabsContent>
					<TabsContent value="settings">
						<SettingsTab tenant={tenant} detail={detail} />
					</TabsContent>
					<TabsContent value="audit">
						<AuditTab detail={detail} />
					</TabsContent>
					<TabsContent value="danger">
						<DangerZoneTab
							onSuspend={() => setSuspendOpen(true)}
							onCancel={() => setCancelOpen(true)}
						/>
					</TabsContent>
				</div>
			</Tabs>

			{/* Change plan placeholder modal */}
			<Dialog open={changePlanOpen} onOpenChange={setChangePlanOpen}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Change plan</DialogTitle>
						<DialogDescription>
							Plan management will be available once the billing API is
							ready.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setChangePlanOpen(false)}
						>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Invite user placeholder modal */}
			<Dialog open={inviteOpen} onOpenChange={setInviteOpen}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Invite user</DialogTitle>
						<DialogDescription>
							User invitation will be available once the members API is
							ready.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setInviteOpen(false)}>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* Suspend confirm */}
			<TypeToConfirmDialog
				open={suspendOpen}
				onOpenChange={setSuspendOpen}
				title="Suspend tenant"
				description="This will immediately lock out all staff, teachers, students and parents. You can reactivate at any time."
				confirmLabel="Suspend tenant"
				tenantName={tenant.name}
				onConfirm={() => {
					// TODO: call suspend mutation
				}}
			/>

			{/* Cancel account confirm */}
			<TypeToConfirmDialog
				open={cancelOpen}
				onOpenChange={setCancelOpen}
				title="Cancel account"
				description="This will terminate the subscription and schedule all tenant data for deletion after 30 days. This action is permanent and cannot be undone."
				confirmLabel="Cancel account"
				tenantName={tenant.name}
				onConfirm={() => {
					// TODO: call cancel mutation
				}}
				variant="destructive"
			/>
		</div>
	);
}
