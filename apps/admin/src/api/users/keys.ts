import type { UserListFilters } from './types';

export const usersKeys = {
	all: ['users'] as const,
	list: (filters?: UserListFilters) =>
		[...usersKeys.all, 'list', filters ?? {}] as const,
	detail: (id: number) => [...usersKeys.all, 'detail', id] as const,
};
