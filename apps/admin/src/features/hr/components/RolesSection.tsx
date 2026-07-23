import { useState } from 'react';
import { Plus, ShieldCheck, Trash2 } from 'lucide-react';

import {
	Badge,
	Button,
	Card,
	ConfirmDialog,
	EmptyState,
	Skeleton,
	toast,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { formatDate } from '@repo/utils';
import { useStatusLabel, useT } from '@repo/i18n';

import { Can } from '@/components/Can';
import { useAppT } from '@/locales';

import { useRevokeRole } from '../api/roles.mutations';
import { useUserRoleAssignments, type RoleAssignment } from '../api/roles.queries';
import { GrantRoleDialog } from './GrantRoleDialog';

interface RolesSectionProps {
	/** `staff.user.id` — role grants hang off the user, not the staff record. */
	userId: number;
	staffName: string;
}

/**
 * The staff member's role grants. Roles are additive and branch-scopable, so this
 * is a list rather than a single field: it is where an owner who also teaches is
 * given TEACHER, which is what admits them to the teacher app and to the group
 * teacher pickers.
 *
 * OWNER cannot be granted or revoked here (the server refuses it) — an owner's
 * OWNER row is shown, but without a remove button.
 */
export function RolesSection({ userId, staffName }: RolesSectionProps) {
	const t = useAppT('hr');
	const tc = useT('common');
	const statusLabel = useStatusLabel();
	const { data: assignments = [], isLoading } = useUserRoleAssignments(userId);
	const revokeRole = useRevokeRole();
	const [grantOpen, setGrantOpen] = useState(false);
	const [revokeTarget, setRevokeTarget] = useState<RoleAssignment | null>(null);

	async function onRevoke() {
		if (!revokeTarget) return;
		try {
			await revokeRole.mutateAsync({ userId, assignmentId: revokeTarget.id });
			toast.success(t('roles.revoked'));
			setRevokeTarget(null);
		} catch (err) {
			toast.error(isApiError(err) ? err.message : tc('error.unknown'));
		}
	}

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<h2 className="text-sm font-semibold">
					{t('roles.heading')}{' '}
					<span className="text-muted-foreground">
						{t('roles.grantedCount', { count: assignments.length })}
					</span>
				</h2>
				<Can permission="role.assign">
					<Button size="sm" onClick={() => setGrantOpen(true)}>
						<Plus className="mr-1.5 size-4" />
						{t('roles.grant')}
					</Button>
				</Can>
			</div>

			{isLoading ? (
				<Card className="gap-0 divide-y divide-border py-0">
					{[1, 2].map((i) => (
						<div key={i} className="px-4 py-3.5">
							<Skeleton className="h-9 w-full" />
						</div>
					))}
				</Card>
			) : assignments.length === 0 ? (
				<Card className="py-0">
					<EmptyState
						icon={<ShieldCheck />}
						title={t('roles.emptyTitle')}
						description={t('roles.emptyDescription')}
						action={
							<Can permission="role.assign">
								<Button size="sm" onClick={() => setGrantOpen(true)}>
									<Plus className="mr-1.5 size-4" />
									{t('roles.grant')}
								</Button>
							</Can>
						}
					/>
				</Card>
			) : (
				<Card className="gap-0 divide-y divide-border py-0">
					{assignments.map((assignment) => (
						<div
							key={assignment.id}
							className="flex items-center justify-between gap-4 px-4 py-3"
						>
							<div className="flex flex-col">
								<span className="text-sm font-medium">
									{statusLabel('role', assignment.roleName)}
								</span>
								<span className="text-xs text-muted-foreground">
									{assignment.branchName ?? t('roles.allBranches')}{' '}
									{t('roles.grantedOn', {
										date: formatDate(assignment.createdAt),
									})}
								</span>
							</div>
							<div className="flex items-center gap-3">
								{!assignment.isActive && (
									<Badge variant="outline" className="text-xs">
										{tc('state.inactive')}
									</Badge>
								)}
								{/*
								 * OWNER/SUPER_ADMIN revocation is refused by the server:
								 * transferring ownership is a platform operation. Offering
								 * the button would only produce a 403.
								 */}
								<Can permission="role.assign">
									{assignment.roleName !== 'OWNER' &&
										assignment.roleName !== 'SUPER_ADMIN' && (
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													setRevokeTarget(assignment)
												}
											>
												<Trash2 className="mr-1.5 size-3.5" />
												{t('roles.revoke')}
											</Button>
										)}
								</Can>
							</div>
						</div>
					))}
				</Card>
			)}

			<GrantRoleDialog
				open={grantOpen}
				onOpenChange={setGrantOpen}
				userId={userId}
				staffName={staffName}
			/>

			<ConfirmDialog
				open={revokeTarget != null}
				onOpenChange={(o) => !o && setRevokeTarget(null)}
				title={t('roles.revokeConfirm.title')}
				description={
					revokeTarget
						? t('roles.revokeConfirm.description', {
								name: staffName,
								role: statusLabel('role', revokeTarget.roleName),
								scope: revokeTarget.branchName
									? t('roles.revokeConfirm.scopeAt', {
											branch: revokeTarget.branchName,
										})
									: '',
							})
						: ''
				}
				confirmLabel={t('roles.revokeConfirm.confirm')}
				variant="destructive"
				loading={revokeRole.isPending}
				onConfirm={() => void onRevoke()}
			/>
		</div>
	);
}
