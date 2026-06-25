export function createQueryKeyFactory<T extends string>(domain: T) {
	return {
		all: [domain] as const,
		lists: () => [domain, 'list'] as const,
		list: (filters: Record<string, unknown>) => [domain, 'list', filters] as const,
		details: () => [domain, 'detail'] as const,
		detail: (id: number) => [domain, 'detail', id] as const,
	};
}
