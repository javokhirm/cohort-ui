import { useState } from 'react';

import { Link, useParams } from '@tanstack/react-router';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, Globe } from 'lucide-react';

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

import { tenantsKeys } from '@/api/tenants/keys';
import {
	cancelTenant,
	suspendTenant,
	unsuspendTenant,
	updateTenant,
} from '@/api/tenants/tenants.mutations';
import { getTenant } from '@/api/tenants/tenants.queries';
import type { UpdateTenantInput } from '@/api/tenants/types';
import { AuditTab } from '@/features/tenants/components/tenantDetails/AuditTab';
import { BranchesTab } from '@/features/tenants/components/tenantDetails/BranchesTab';
import { ChangePlanDialog } from '@/features/tenants/components/tenantDetails/ChangePlanDialog';
import { DangerZoneTab } from '@/features/tenants/components/tenantDetails/DangerZoneTab';
import { MembersTab } from '@/features/tenants/components/tenantDetails/MembersTab';
import { OverviewTab } from '@/features/tenants/components/tenantDetails/OverviewTab';
import { SettingsTab } from '@/features/tenants/components/tenantDetails/SettingsTab';
import { SubscriptionTab } from '@/features/tenants/components/tenantDetails/SubscriptionTab';
import { TypeToConfirmDialog } from '@/features/tenants/components/tenantDetails/TypeToConfirmDialog';
import { avatarClass, getInitials } from '@/features/tenants/utils';

const TAB_TRIGGER_CLASS = cn(
	'cursor-pointer -mb-px rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2',
	'text-sm font-medium text-muted-foreground transition-colors hover:text-foreground',
	'data-[state=active]:border-b-primary data-[state=active]:bg-transparent',
	'data-[state=active]:text-primary data-[state=active]:shadow-none',
);

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
				title="Suspend tenant"
				description="This will immediately lock out all staff, teachers, students and parents. You can reactivate at any time."
				confirmLabel="Suspend tenant"
				tenantName={tenant.name}
				loading={suspendMutation.isPending}
				onConfirm={() => suspendMutation.mutate(undefined)}
			/>

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
