import { useState } from 'react';

import {
	Button,
	Checkbox,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	Spinner,
	toast,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { useStatusLabel, useT } from '@repo/i18n';

import { useAppT } from '@/locales';
import { useBranches } from '@/api/branches';

import { useGrantRole } from '../api/roles.mutations';
import { useRoleCatalog } from '../api/roles.queries';
import { STAFF_GRANTABLE_ROLES } from '../lib/roles';

interface GrantRoleDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	userId: number;
	staffName: string;
}

/**
 * Grant one role across one or more branches. The dropdown is narrowed twice:
 * `isAssignable` (OWNER/SUPER_ADMIN are not, so the escalation rule is not
 * duplicated here) and `STAFF_GRANTABLE_ROLES`, since `GET /roles` is a generic
 * tenant-wide catalog that also includes STUDENT/STUDENT_GUARDIAN — roles no
 * staff member should ever be offered here.
 *
 * A staff member's branch access IS their set of role grants — one row per
 * branch — so assigning someone to three branches is three grants. This picks
 * the role once and fans out, rather than making the operator reopen the dialog
 * per branch. "All branches" is the tenant-wide grant (`branchId: null`) and is
 * therefore exclusive: it already covers every branch.
 *
 * The branch list comes from `useBranches()` (`GET /manage/branches`), which the
 * backend already narrows to the caller's own scope — a branch-scoped admin
 * cannot even see, let alone grant, a branch they do not hold. The server
 * re-checks regardless; this is UX, not enforcement.
 */
export function GrantRoleDialog({
	open,
	onOpenChange,
	userId,
	staffName,
}: GrantRoleDialogProps) {
	const t = useAppT('hr');
	const tc = useT('common');
	const statusLabel = useStatusLabel();
	const { data: roles = [], isLoading: rolesLoading } = useRoleCatalog();
	const { data: branches = [], isLoading: branchesLoading } = useBranches();
	const grantRole = useGrantRole();

	const [roleId, setRoleId] = useState<string>('');
	const [allBranches, setAllBranches] = useState(false);
	const [branchIds, setBranchIds] = useState<number[]>([]);

	const assignableRoles = roles.filter(
		(role) => role.isAssignable && STAFF_GRANTABLE_ROLES.includes(role.name),
	);
	const canSubmit = Boolean(roleId) && (allBranches || branchIds.length > 0);

	function close() {
		onOpenChange(false);
		setRoleId('');
		setAllBranches(false);
		setBranchIds([]);
	}

	function toggleBranch(id: number) {
		setBranchIds((current) =>
			current.includes(id) ? current.filter((b) => b !== id) : [...current, id],
		);
	}

	/** "All branches" subsumes every individual pick, so selecting it clears them. */
	function toggleAllBranches(checked: boolean) {
		setAllBranches(checked);
		if (checked) setBranchIds([]);
	}

	async function onGrant() {
		if (!canSubmit) return;

		// One request per branch — the endpoint grants a single (role, branch)
		// pair. `allSettled` so a branch that fails does not discard the grants
		// that succeeded; the operator is told exactly which ones did not land.
		const targets: (number | null)[] = allBranches ? [null] : branchIds;
		const results = await Promise.allSettled(
			targets.map((branchId) =>
				grantRole.mutateAsync({ userId, roleId: Number(roleId), branchId }),
			),
		);

		// Already holding the role at a branch is the desired end state, not a
		// failure — re-granting across an overlapping set should be idempotent.
		const failures = results.filter(
			(r) =>
				r.status === 'rejected' &&
				!(isApiError(r.reason) && r.reason.code === 'ROLE_ASSIGNMENT_EXISTS'),
		);

		if (failures.length === 0) {
			toast.success(t('roles.granted'));
			close();
			return;
		}

		const [first] = failures;
		const reason =
			first?.status === 'rejected' && isApiError(first.reason)
				? first.reason.message
				: tc('error.unknown');

		if (failures.length === results.length) {
			toast.error(reason);
			return;
		}

		// Partial success: the dialog stays open so the operator can retry the
		// rest, and the grants that landed are already invalidated into the list.
		toast.error(t('roles.grantPartial', { count: failures.length, reason }));
	}

	return (
		<Dialog open={open} onOpenChange={(o) => !o && close()}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>{t('roles.dialog.title')}</DialogTitle>
					<DialogDescription>
						{t('roles.dialog.description', { name: staffName })}
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<Label htmlFor="role">{t('roles.dialog.role')}</Label>
						<Select value={roleId} onValueChange={setRoleId}>
							<SelectTrigger id="role" className="w-full">
								<SelectValue
									placeholder={
										rolesLoading
											? t('roles.dialog.loading')
											: t('roles.dialog.rolePlaceholder')
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{assignableRoles.map((role) => (
									<SelectItem key={role.id} value={String(role.id)}>
										{statusLabel('role', role.name)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-2">
						<Label>{t('roles.dialog.branches')}</Label>
						<div className="max-h-56 overflow-y-auto rounded-lg border">
							{branchesLoading ? (
								<div className="p-4 text-sm text-muted-foreground">
									{t('roles.dialog.loading')}
								</div>
							) : (
								<div className="divide-y divide-border">
									<label className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted">
										<Checkbox
											checked={allBranches}
											onCheckedChange={(checked) =>
												toggleAllBranches(checked === true)
											}
										/>
										<span className="text-sm font-medium">
											{t('roles.allBranches')}
										</span>
									</label>
									{branches.map((branch) => (
										<label
											key={branch.id}
											className="flex cursor-pointer items-center gap-3 px-3 py-2.5 hover:bg-muted aria-disabled:cursor-not-allowed aria-disabled:opacity-50"
											aria-disabled={allBranches}
										>
											<Checkbox
												checked={branchIds.includes(branch.id)}
												disabled={allBranches}
												onCheckedChange={() =>
													toggleBranch(branch.id)
												}
											/>
											<span className="text-sm">{branch.name}</span>
										</label>
									))}
								</div>
							)}
						</div>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={close}>
						{tc('action.cancel')}
					</Button>
					<Button
						disabled={!canSubmit || grantRole.isPending}
						onClick={() => void onGrant()}
					>
						{grantRole.isPending && <Spinner className="mr-2 size-4" />}
						{allBranches || branchIds.length <= 1
							? t('roles.dialog.submit')
							: t('roles.dialog.submitCount', { count: branchIds.length })}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
