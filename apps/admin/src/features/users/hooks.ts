import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { usersKeys } from '@/api/users/keys';
import { getUser, listUsers } from '@/api/users/users.queries';
import { deactivateUser, resetUserPassword } from '@/api/users/users.mutations';

import { PAGE_SIZE } from './constants';

export function useUserList({ page, search }: { page: number; search?: string }) {
	const filters = { page, limit: PAGE_SIZE, search: search || undefined };
	return useQuery({
		queryKey: usersKeys.list(filters),
		queryFn: () => listUsers(filters),
	});
}

export function useUserDetail(id: number, enabled: boolean) {
	return useQuery({
		queryKey: usersKeys.detail(id),
		queryFn: () => getUser(id),
		enabled,
	});
}

export function useDeactivateUser(id: number, options?: { onSuccess?: () => void }) {
	const queryClient = useQueryClient();
	return useMutation({
		mutationFn: () => deactivateUser(id),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: usersKeys.detail(id) });
			void queryClient.invalidateQueries({ queryKey: usersKeys.all });
			options?.onSuccess?.();
		},
	});
}

export function useResetPassword(id: number, options?: { onSuccess?: () => void }) {
	return useMutation({
		mutationFn: (values: { newPassword: string }) =>
			resetUserPassword(id, { newPassword: values.newPassword }),
		onSuccess: options?.onSuccess,
	});
}
