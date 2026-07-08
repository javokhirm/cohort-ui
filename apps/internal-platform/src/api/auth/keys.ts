/** Query keys for the auth/identity surface. */
export const authKeys = {
	all: ['auth'] as const,
	me: () => [...authKeys.all, 'me'] as const,
};
