import { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { Eye } from 'lucide-react';

import {
	Avatar,
	AvatarFallback,
	Button,
	Skeleton,
	StatusBadge,
	Tabs,
	TabsContent,
	TabsList,
	TabsTrigger,
	cn,
} from '@repo/ui';

import { ImportsTab } from '@/features/student-imports/components/ImportsTab';
import { AuditTab } from '@/features/tenants/components/tenantDetails/AuditTab';
import { BillingPolicyTab } from '@/features/tenants/components/tenantDetails/BillingPolicyTab';
import { BranchesTab } from '@/features/tenants/components/tenantDetails/BranchesTab';
import { ChangePlanDialog } from '@/features/tenants/components/tenantDetails/ChangePlanDialog';
import { DangerZoneTab } from '@/features/tenants/components/tenantDetails/DangerZoneTab';
import { MembersTab } from '@/features/tenants/components/tenantDetails/MembersTab';
import { OverviewTab } from '@/features/tenants/components/tenantDetails/OverviewTab';
import { SettingsTab } from '@/features/tenants/components/tenantDetails/SettingsTab';
import { SubscriptionTab } from '@/features/tenants/components/tenantDetails/SubscriptionTab';
import { TypeToConfirmDialog } from '@/features/tenants/components/tenantDetails/TypeToConfirmDialog';
import { avatarClass, getInitials } from '@/features/tenants/utils';
import { TENANT_STATUS_TONE, tenantStatusLabel } from '@/features/tenants/constants';
import {
	useCancelTenant,
	useSuspendTenant,
	useTenant,
	useUnsuspendTenant,
	useUpdateTenant,
} from '@/features/tenants/hooks';
import { useAppT } from '@/locales';

export function TenantDetailPage() {
	const t = useAppT('tenants');
	const tShell = useAppT('shell');
	const { tenantId } = useParams({ strict: false }) as { tenantId?: string };
	const numericId = tenantId ? parseInt(tenantId, 10) : NaN;
	const isValidId = !isNaN(numericId);

	const [suspendOpen, setSuspendOpen] = useState(false);
	const [unsuspendOpen, setUnsuspendOpen] = useState(false);
	const [cancelOpen, setCancelOpen] = useState(false);
	const [changePlanOpen, setChangePlanOpen] = useState(false);

	const { data: tenant, isLoading, isError } = useTenant(numericId, isValidId);

	const suspendMutation = useSuspendTenant(numericId, {
		onSuccess: () => setSuspendOpen(false),
	});
	const unsuspendMutation = useUnsuspendTenant(numericId, {
		onSuccess: () => setUnsuspendOpen(false),
	});
	const cancelMutation = useCancelTenant(numericId, {
		onSuccess: () => setCancelOpen(false),
	});
	const updateMutation = useUpdateTenant(numericId);

	if (!isValidId || isError) {
		return (
			<div className="flex flex-col items-center gap-4 py-24 text-center">
				<p className="text-muted-foreground">{t('notFound')}</p>
				<Link to="/tenants">
					<Button variant="outline">← {t('backToList')}</Button>
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
				← {t('backToList')}
			</Link>

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
							<StatusBadge tone={TENANT_STATUS_TONE[tenant.status]}>
								{tenantStatusLabel(t, tenant.status)}
							</StatusBadge>
						</div>
					</div>
				</div>

				<Button variant="outline" size="sm" className="gap-1.5" disabled>
					<Eye className="size-4" />
					{tShell('impersonate')}
				</Button>
			</div>

			<Tabs defaultValue="overview" className="gap-0" variant="underline">
				<TabsList>
					<TabsTrigger value="overview">{t('tab.overview')}</TabsTrigger>
					<TabsTrigger value="subscription">
						{t('tab.subscription')}
					</TabsTrigger>
					<TabsTrigger value="billing-policy">
						{t('tab.billingPolicy')}
					</TabsTrigger>
					<TabsTrigger value="branches">{t('tab.branches')}</TabsTrigger>
					<TabsTrigger value="members">{t('tab.members')}</TabsTrigger>
					<TabsTrigger value="imports">{t('tab.imports')}</TabsTrigger>
					<TabsTrigger value="settings">{t('tab.settings')}</TabsTrigger>
					<TabsTrigger value="audit">{t('tab.audit')}</TabsTrigger>
					<TabsTrigger
						value="danger"
						className="text-destructive data-[state=active]:border-b-destructive data-[state=active]:text-destructive"
					>
						{t('danger.zone')}
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
					<TabsContent value="billing-policy">
						<BillingPolicyTab tenantId={numericId} />
					</TabsContent>
					<TabsContent value="branches">
						<BranchesTab branches={tenant.branches ?? []} />
					</TabsContent>
					<TabsContent value="members">
						<MembersTab members={tenant.members ?? []} />
					</TabsContent>
					<TabsContent value="imports">
						<ImportsTab tenantId={numericId} />
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

			<ChangePlanDialog
				open={changePlanOpen}
				onOpenChange={setChangePlanOpen}
				tenantId={numericId}
				currentTierId={tenant.subscriptionTierId}
				currentBillingInterval={tenant.subscription?.billingInterval ?? null}
			/>

			<TypeToConfirmDialog
				open={suspendOpen}
				onOpenChange={setSuspendOpen}
				title={t('danger.suspend')}
				description={t('danger.suspendDescription')}
				confirmLabel={t('danger.suspend')}
				tenantName={tenant.name}
				loading={suspendMutation.isPending}
				onConfirm={() => suspendMutation.mutate(undefined)}
			/>

			<TypeToConfirmDialog
				open={unsuspendOpen}
				onOpenChange={setUnsuspendOpen}
				title={t('danger.unsuspend')}
				description={t('danger.unsuspendDescription')}
				confirmLabel={t('danger.unsuspend')}
				tenantName={tenant.name}
				loading={unsuspendMutation.isPending}
				onConfirm={() => unsuspendMutation.mutate(undefined)}
			/>

			<TypeToConfirmDialog
				open={cancelOpen}
				onOpenChange={setCancelOpen}
				title={t('danger.cancelAccount')}
				description={t('danger.cancelDescription')}
				confirmLabel={t('danger.cancelAccount')}
				tenantName={tenant.name}
				loading={cancelMutation.isPending}
				onConfirm={() => cancelMutation.mutate(undefined)}
				variant="destructive"
			/>
		</div>
	);
}
