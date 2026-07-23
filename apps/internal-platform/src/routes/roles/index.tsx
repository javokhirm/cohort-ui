import { useState } from 'react';
import { Info } from 'lucide-react';

import {
	usePermissions,
	useRoles,
	useUpdateRolePermissions,
} from '@/features/roles/hooks';
import { PermissionMatrix } from '@/features/roles/components/PermissionMatrix';
import { MatrixSkeleton } from '@/features/roles/components/MatrixSkeleton';
import { useAppT } from '@/locales';

export function RoleTemplatesPage() {
	const t = useAppT('roles');
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
				<h1 className="text-xl font-semibold tracking-tight">{t('title')}</h1>
				<p className="text-sm text-muted-foreground">{t('description')}</p>
			</div>

			<div className="flex items-start gap-3 rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-800 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300">
				<Info className="mt-0.5 size-4 shrink-0" />
				<p>{t('warning')}</p>
			</div>

			{isError && (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					{t('loadError')}
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
