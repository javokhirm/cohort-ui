import { useState } from 'react';
import { Link, useNavigate } from '@tanstack/react-router';
import {
	ArrowLeft,
	Building2,
	Edit,
	KeyRound,
	Mail,
	MessageSquare,
	Phone,
} from 'lucide-react';

import {
	ActionsMenu,
	Badge,
	Card,
	CardContent,
	DetailRows,
	Separator,
	Skeleton,
	StatusBadge,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	toast,
} from '@repo/ui';
import { formatDate, formatMoney } from '@repo/utils';
import { useStatusLabel } from '@repo/i18n';

import { useAppT } from '@/locales';
import { usePermissions } from '@/features/auth/hooks';
import { usePayrollHistory } from '@/features/payroll/api/payroll.queries';

import { useStaffMember, type StaffResponse } from '../api/staff.queries';
import { ChangeStaffPasswordDialog } from '../components/ChangeStaffPasswordDialog';
import { PayrollConfigCard } from '../components/PayrollConfigCard';
import { RolesSection } from '../components/RolesSection';
import { primaryRole } from '../lib/roles';

// ─── Header ───────────────────────────────────────────────────────────────────

function StaffHeader({ staff, onEdit }: { staff: StaffResponse; onEdit: () => void }) {
	const t = useAppT('hr');
	const statusLabel = useStatusLabel();
	const [passwordOpen, setPasswordOpen] = useState(false);
	const { can } = usePermissions();
	const initials =
		`${staff.user.firstName?.[0] ?? ''}${staff.user.lastName?.[0] ?? ''}`.toUpperCase();
	const role = primaryRole(staff.roles);
	const fullName = `${staff.user.firstName} ${staff.user.lastName}`;
	const subtitle = [staff.position, staff.staffCode, staff.branch?.name]
		.filter(Boolean)
		.join(' · ');

	return (
		<div className="rounded-xl border bg-card p-5">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-4">
					<div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
						{initials}
					</div>
					<div>
						<div className="flex items-center gap-2.5">
							<h1 className="text-lg font-bold">
								{staff.user.firstName} {staff.user.lastName}
							</h1>
							{role && (
								<Badge variant="secondary" className="text-xs">
									{statusLabel('role', role)}
								</Badge>
							)}
							<StatusBadge kind="staff" status={staff.status}>
								{statusLabel('staff', staff.status)}
							</StatusBadge>
						</div>
						{subtitle && (
							<div className="mt-0.5 text-sm text-muted-foreground">
								{subtitle}
							</div>
						)}
					</div>
				</div>

				<ActionsMenu
					label={t('detail.actionsLabel')}
					items={[
						{
							label: t('detail.action.edit'),
							icon: Edit,
							onClick: onEdit,
							hidden: !can('staff.update'),
						},
						{
							label: t('detail.action.changePassword'),
							icon: KeyRound,
							onClick: () => setPasswordOpen(true),
							hidden: !can('staff.update'),
						},
						{
							label: t('detail.action.message'),
							icon: MessageSquare,
							onClick: () =>
								toast.info(t('detail.action.messagingUnavailable')),
						},
					]}
				/>
			</div>

			<ChangeStaffPasswordDialog
				open={passwordOpen}
				onOpenChange={setPasswordOpen}
				staffId={staff.id}
				staffName={fullName}
			/>
		</div>
	);
}

// ─── Overview tab ─────────────────────────────────────────────────────────────

function OverviewTab({ staff }: { staff: StaffResponse }) {
	const t = useAppT('hr');
	const subjects =
		staff.specialization.length > 0 ? staff.specialization.join(', ') : '—';

	return (
		<div className="grid gap-4 lg:grid-cols-2">
			<Card>
				<CardContent>
					<p className="mb-1 font-semibold">{t('detail.contactTitle')}</p>
					<DetailRows
						rows={[
							{
								label: t('detail.row.phone'),
								value: staff.user.phone,
								icon: <Phone />,
							},
							{
								label: t('detail.row.email'),
								value: staff.user.email ?? '—',
								icon: <Mail />,
							},
							{
								label: t('detail.row.branch'),
								value: staff.branch?.name ?? '—',
								icon: <Building2 />,
							},
						]}
					/>
				</CardContent>
			</Card>

			<Card>
				<CardContent>
					<p className="mb-1 font-semibold">{t('detail.employmentTitle')}</p>
					<DetailRows
						rows={[
							{
								label: t('detail.row.contract'),
								value: t(`employment.${staff.employmentType}`),
							},
							{
								label: t('detail.row.joined'),
								value: staff.hireDate ? formatDate(staff.hireDate) : '—',
							},
							{
								label: t('detail.row.weeklyLoad'),
								value: t('detail.weeklyHours', {
									count: staff.weeklyHours,
								}),
							},
							{ label: t('detail.row.subjects'), value: subjects },
						]}
					/>
				</CardContent>
			</Card>
		</div>
	);
}

// ─── Payroll tab ──────────────────────────────────────────────────────────────

function PayrollTab({ staff }: { staff: StaffResponse }) {
	const t = useAppT('hr');
	const statusLabel = useStatusLabel();
	const navigate = useNavigate();
	const { data, isLoading } = usePayrollHistory({ staffId: staff.id, limit: 12 });
	const payslips = data?.rows ?? [];

	return (
		<div className="grid gap-4 lg:grid-cols-3">
			<PayrollConfigCard staffId={staff.id} />

			<Card className="lg:col-span-2">
				<CardContent>
					<p className="mb-3 font-semibold">{t('detail.recentPayslips')}</p>
					{isLoading ? (
						<div className="flex flex-col gap-2">
							{[1, 2, 3].map((i) => (
								<Skeleton key={i} className="h-12 rounded-lg" />
							))}
						</div>
					) : payslips.length === 0 ? (
						<p className="py-6 text-center text-sm text-muted-foreground">
							{t('detail.noPayslips')}
						</p>
					) : (
						<div className="flex flex-col">
							{payslips.map((p, i) => (
								<div key={p.id}>
									{i > 0 && <Separator />}
									<button
										type="button"
										onClick={() =>
											void navigate({
												to: '/payroll/$staffId',
												params: {
													staffId: String(p.staffId),
												},
												search: { month: p.month },
											})
										}
										className="flex w-full items-center justify-between rounded-md py-3 text-left hover:bg-muted/50"
									>
										<div>
											<p className="text-sm font-medium">
												{formatDate(p.periodStart)} –{' '}
												{formatDate(p.periodEnd)}
											</p>
											<p className="text-xs text-muted-foreground">
												{t('detail.net', {
													amount: formatMoney(p.netAmount),
												})}
											</p>
										</div>
										<StatusBadge kind="payroll" status={p.status}>
											{statusLabel('payroll', p.status)}
										</StatusBadge>
									</button>
								</div>
							))}
						</div>
					)}
				</CardContent>
			</Card>
		</div>
	);
}

// ─── Activity tab ─────────────────────────────────────────────────────────────

function ActivityTab() {
	const t = useAppT('hr');

	return (
		<div className="flex min-h-32 items-center justify-center rounded-xl border text-sm text-muted-foreground">
			{t('detail.noActivity')}
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

interface StaffDetailPageProps {
	staffId: number;
}

export function StaffDetailPage({ staffId }: StaffDetailPageProps) {
	const t = useAppT('hr');
	const navigate = useNavigate();
	const { data: staff, isLoading, isError } = useStaffMember(staffId);

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-5">
			<Link
				to="/staff"
				className="flex w-fit items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
			>
				<ArrowLeft className="size-3.5" />
				{t('detail.back')}
			</Link>

			{isLoading ? (
				<div className="rounded-xl border bg-card p-5">
					<div className="flex items-center gap-4">
						<Skeleton className="size-12 rounded-full" />
						<div className="flex flex-col gap-2">
							<Skeleton className="h-5 w-40" />
							<Skeleton className="h-4 w-64" />
						</div>
					</div>
				</div>
			) : isError || !staff ? (
				<div className="flex min-h-40 items-center justify-center rounded-xl border text-sm text-muted-foreground">
					{t('detail.notFound')}
				</div>
			) : (
				<>
					<StaffHeader
						staff={staff}
						onEdit={() =>
							void navigate({
								to: '/staff/$staffId/edit',
								params: { staffId: String(staff.id) },
							})
						}
					/>

					<Tabs defaultValue="overview" variant="underline">
						<TabsList>
							<TabsTrigger value="overview">
								{t('detail.tab.overview')}
							</TabsTrigger>
							<TabsTrigger value="roles">
								{t('detail.tab.roles')}
							</TabsTrigger>
							<TabsTrigger value="payroll">
								{t('detail.tab.payroll')}
							</TabsTrigger>
							<TabsTrigger value="activity">
								{t('detail.tab.activity')}
							</TabsTrigger>
						</TabsList>

						<div className="mt-4">
							<TabsContent value="overview">
								<OverviewTab staff={staff} />
							</TabsContent>
							<TabsContent value="roles">
								<RolesSection
									userId={staff.user.id}
									staffName={`${staff.user.firstName} ${staff.user.lastName}`}
								/>
							</TabsContent>
							<TabsContent value="payroll">
								<PayrollTab staff={staff} />
							</TabsContent>
							<TabsContent value="activity">
								<ActivityTab />
							</TabsContent>
						</div>
					</Tabs>
				</>
			)}
		</div>
	);
}
