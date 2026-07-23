import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { rolesKeys } from '@/api/roles/keys';
import { listPermissions, listRoles } from '@/api/roles/roles.queries';
import { updateRolePermissions } from '@/api/roles/roles.mutations';
import type { RoleView } from '@/api/roles/types';
import { toast } from '@repo/ui';
import { useAppT } from '@/locales';

export function useRoles() {
	return useQuery({
		queryKey: rolesKeys.list(),
		queryFn: listRoles,
	});
}

export function usePermissions() {
	return useQuery({
		queryKey: rolesKeys.permissions(),
		queryFn: listPermissions,
	});
}

export function useUpdateRolePermissions() {
	const queryClient = useQueryClient();
	const t = useAppT('roles');
	return useMutation({
		mutationFn: ({
			roleName,
			permissionCodes,
		}: {
			roleName: string;
			permissionCodes: string[];
		}) => updateRolePermissions(roleName, { permissionCodes }),
		onMutate: async ({ roleName, permissionCodes }) => {
			await queryClient.cancelQueries({ queryKey: rolesKeys.list() });
			const prev = queryClient.getQueryData<RoleView[]>(rolesKeys.list());
			queryClient.setQueryData<RoleView[]>(
				rolesKeys.list(),
				(old) =>
					old?.map((r) =>
						r.name === roleName ? { ...r, permissions: permissionCodes } : r,
					) ?? [],
			);
			return { prev };
		},
		onError: (_err, _vars, ctx) => {
			if (ctx?.prev) queryClient.setQueryData(rolesKeys.list(), ctx.prev);
			toast.error(t('updateError'));
		},
		onSettled: () => {
			void queryClient.invalidateQueries({ queryKey: rolesKeys.list() });
		},
	});
}
