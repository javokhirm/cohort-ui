import type { PaginationParams } from './pagination';

export function createQueryKeyFactory<T extends string>(domain: T) {
	return {
		all: [domain] as const,
		lists: () => [domain, 'list'] as const,
		list: (filters: Record<string, unknown>) => [domain, 'list', filters] as const,
		details: () => [domain, 'detail'] as const,
		detail: (id: number) => [domain, 'detail', id] as const,
	};
}

/**
 * Keys for the `/manage/subscription` resources — shared here (rather than a
 * per-app `features/<domain>/api/keys.ts`) because the 402 handling in
 * `errors.ts` and `retry.ts` is cross-cutting across every surface, so the
 * resources it points back to (the renewal screen's own data) live alongside it.
 */
export const subscriptionKeys = {
	all: ['subscription'] as const,
	current: () => [...subscriptionKeys.all, 'current'] as const,
	quote: () => [...subscriptionKeys.all, 'quote'] as const,
	plans: () => [...subscriptionKeys.all, 'plans'] as const,
	invoices: (params: PaginationParams = {}) =>
		[...subscriptionKeys.all, 'invoices', params] as const,
	payments: (params: PaginationParams = {}) =>
		[...subscriptionKeys.all, 'payments', params] as const,
};
