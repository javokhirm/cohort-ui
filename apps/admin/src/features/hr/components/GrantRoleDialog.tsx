import { useState } from 'react';

import {
	Button,
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

/** Sentinel for the "all branches" option — a Select value must be a string. */
const ALL_BRANCHES = 'all';

interface GrantRoleDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	userId: number;
	staffName: string;
}

/**
 * Grant one role to a staff member, optionally scoped to a branch. Only the roles
 * the server will actually accept are offered (`isAssignable` — OWNER and
 * SUPER_ADMIN are not), so the escalation rule is not duplicated here.
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
	const { data: branches = [] } = useBranches();
	const grantRole = useGrantRole();

	const [roleId, setRoleId] = useState<string>('');
	const [branchId, setBranchId] = useState<string>(ALL_BRANCHES);

	const assignableRoles = roles.filter((role) => role.isAssignable);

	function close() {
		onOpenChange(false);
		setRoleId('');
		setBranchId(ALL_BRANCHES);
	}

	async function onGrant() {
		if (!roleId) return;
		try {
			await grantRole.mutateAsync({
				userId,
				roleId: Number(roleId),
				branchId: branchId === ALL_BRANCHES ? null : Number(branchId),
			});
			toast.success(t('roles.granted'));
			close();
		} catch (err) {
			if (isApiError(err) && err.code === 'ROLE_ASSIGNMENT_EXISTS') {
				toast.error(t('roles.alreadyHeld'));
			} else if (isApiError(err)) {
				toast.error(err.message);
			} else {
				toast.error(tc('error.unknown'));
			}
		}
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
						<Label htmlFor="branch">{t('roles.dialog.branch')}</Label>
						<Select value={branchId} onValueChange={setBranchId}>
							<SelectTrigger id="branch" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL_BRANCHES}>
									{t('roles.allBranches')}
								</SelectItem>
								{branches.map((branch) => (
									<SelectItem key={branch.id} value={String(branch.id)}>
										{branch.name}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>
				</div>

				<DialogFooter>
					<Button variant="outline" onClick={close}>
						{tc('action.cancel')}
					</Button>
					<Button
						disabled={!roleId || grantRole.isPending}
						onClick={() => void onGrant()}
					>
						{grantRole.isPending && <Spinner className="mr-2 size-4" />}
						{t('roles.dialog.submit')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
