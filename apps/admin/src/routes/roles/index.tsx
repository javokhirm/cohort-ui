import { useState } from 'react';
import { Info } from 'lucide-react';

import { usePermissions, useRoles, useUpdateRolePermissions } from '@/features/roles/hooks';
import { PermissionMatrix } from '@/features/roles/components/PermissionMatrix';
import { MatrixSkeleton } from '@/features/roles/components/MatrixSkeleton';

export function RoleTemplatesPage() {
	const { data: roles, isLoading: rolesLoading, isError: rolesError } = useRoles();
	const {
		data: catalog,
		isLoading: catalogLoading,
		isError: catalogError,
	} = usePermissions();

	const updateMutation = useUpdateRolePermissions();
	const [savingRole, setSavingRole] = useState<string | null>(null);

	const isLoading = rolesLoading || catalogLoading;
	const isError = rolesError || catalogError;

	function handleToggle(roleName: string, permCode: string, checked: boolean) {
		const role = roles?.find((r) => r.name === roleName);
		if (!role) return;

		const current = new Set(role.permissions);
		if (checked) {
			current.add(permCode);
		} else {
			current.delete(permCode);
		}

		setSavingRole(roleName);
		updateMutation.mutate(
			{ roleName, permissionCodes: Array.from(current) },
			{ onSettled: () => setSavingRole(null) },
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-xl font-semibold tracking-tight">
					Role &amp; Permission Templates
				</h1>
				<p className="text-sm text-muted-foreground">
					The default roles provisioned to every new tenant.
				</p>
			</div>

			<div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
				<Info className="mt-0.5 size-4 shrink-0" />
				<p>
					Editing a system-role template takes effect{' '}
					<strong>globally across all tenants immediately</strong>. Locked roles (OWNER,
					SUPER_ADMIN) cannot be modified.
				</p>
			</div>

			{isError && (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					Failed to load role templates. Please refresh.
				</div>
			)}

			{isLoading ? (
				<MatrixSkeleton />
			) : roles && catalog ? (
				<PermissionMatrix
					roles={roles}
					catalog={catalog}
					onToggle={handleToggle}
					savingRole={savingRole}
				/>
			) : null}
		</div>
	);
}
