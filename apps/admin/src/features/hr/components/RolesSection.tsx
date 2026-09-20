import { useState } from 'react';
import { Plus, ShieldCheck, X } from 'lucide-react';

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

/**
 * Collapse the flat assignment list into one entry per role, each carrying the
 * branches it was granted at. Insertion-ordered, so the server's `id ASC` order
 * decides which role heads the list.
 */
function groupByRole(assignments: RoleAssignment[]): [string, RoleAssignment[]][] {
	const byRole = new Map<string, RoleAssignment[]>();
	for (const assignment of assignments) {
		const grants = byRole.get(assignment.roleName) ?? [];
		grants.push(assignment);
		byRole.set(assignment.roleName, grants);
	}
	return [...byRole.entries()];
}

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
					{groupByRole(assignments).map(([roleName, grants]) => (
						<div key={roleName} className="flex flex-col gap-2 px-4 py-3">
							<span className="text-sm font-medium">
								{statusLabel('role', roleName)}
							</span>
							{/*
							 * One chip per branch: a staff member's branch access IS
							 * their set of grants, so this is the list of branches
							 * they can reach with this role. Each chip removes only
							 * its own grant, leaving the others intact.
							 */}
							<div className="flex flex-wrap items-center gap-1.5">
								{grants.map((assignment) => (
									<Badge
										key={assignment.id}
										variant={assignment.isActive ? 'secondary' : 'outline'}
										className="gap-1 py-1 pl-2.5 pr-1 font-normal"
										title={t('roles.grantedOn', {
											date: formatDate(assignment.createdAt),
										})}
									>
										<span className={assignment.isActive ? '' : 'line-through'}>
											{assignment.branchName ?? t('roles.allBranches')}
										</span>
										{/*
										 * OWNER/SUPER_ADMIN revocation is refused by the
										 * server: transferring ownership is a platform
										 * operation. Offering the button would only
										 * produce a 403.
										 */}
										<Can permission="role.assign">
											{roleName !== 'OWNER' && roleName !== 'SUPER_ADMIN' && (
												<Button
													variant="ghost"
													size="icon"
													className="size-4 hover:bg-transparent"
													aria-label={t('roles.revokeBranch', {
														branch:
															assignment.branchName ??
															t('roles.allBranches'),
													})}
													onClick={() => setRevokeTarget(assignment)}
												>
													<X className="size-3" />
												</Button>
											)}
										</Can>
									</Badge>
								))}
								<Can permission="role.assign">
									<Button
										variant="ghost"
										size="sm"
										className="h-6 px-2 text-xs text-muted-foreground"
										onClick={() => setGrantOpen(true)}
									>
										<Plus className="mr-1 size-3" />
										{t('roles.addBranch')}
									</Button>
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
