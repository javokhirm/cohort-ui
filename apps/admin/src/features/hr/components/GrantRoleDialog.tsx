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

import { useBranches } from '@/api/branches';

import { useGrantRole } from '../api/roles.mutations';
import { useRoleCatalog } from '../api/roles.queries';
import { roleLabel } from '../lib/roles';

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
			toast.success('Role granted');
			close();
		} catch (err) {
			if (isApiError(err) && err.code === 'ROLE_ASSIGNMENT_EXISTS') {
				toast.error('They already hold this role in that branch.');
			} else if (isApiError(err)) {
				toast.error(err.message);
			} else {
				toast.error('Something went wrong');
			}
		}
	}

	return (
		<Dialog open={open} onOpenChange={(o) => !o && close()}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>Grant a role</DialogTitle>
					<DialogDescription>
						{staffName} keeps the roles they already hold — this one is added
						alongside them.
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-2">
						<Label htmlFor="role">Role</Label>
						<Select value={roleId} onValueChange={setRoleId}>
							<SelectTrigger id="role" className="w-full">
								<SelectValue
									placeholder={
										rolesLoading ? 'Loading…' : 'Select a role'
									}
								/>
							</SelectTrigger>
							<SelectContent>
								{assignableRoles.map((role) => (
									<SelectItem key={role.id} value={String(role.id)}>
										{roleLabel(role.name)}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					<div className="flex flex-col gap-2">
						<Label htmlFor="branch">Branch</Label>
						<Select value={branchId} onValueChange={setBranchId}>
							<SelectTrigger id="branch" className="w-full">
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value={ALL_BRANCHES}>All branches</SelectItem>
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
						Cancel
					</Button>
					<Button
						disabled={!roleId || grantRole.isPending}
						onClick={() => void onGrant()}
					>
						{grantRole.isPending && <Spinner className="mr-2 size-4" />}
						Grant role
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
