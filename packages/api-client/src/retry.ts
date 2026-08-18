import { isApiError } from './errors';

/**
 * Default TanStack Query `retry` predicate for `queryClient.ts` in every app.
 * A 402 (subscription lapsed) is a deterministic block — the guard rejects
 * every request the same way until the plan is renewed, so retrying just
 * repeats the same failure. Everything else keeps the prior blanket
 * `retry: 1` behaviour (one retry).
 */
export function defaultQueryRetry(failureCount: number, error: unknown): boolean {
	if (isApiError(error) && error.status === 402) return false;
	return failureCount < 1;
}
