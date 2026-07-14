import { redirect } from '@tanstack/react-router';

import { hasRole, useSessionStore } from '@/store/sessionStore';

/**
 * Route guards (docs/auth-and-rbac.md §7). UI gating is cosmetic — the backend
 * enforces every rule via its TeachApi role guard — but keeps a non-teacher out
 * of a console whose every request would 403.
 * Call inside a route's `beforeLoad`; they throw a redirect on failure.
 */

export function requireAuth(href: string): void {
	if (useSessionStore.getState().status !== 'authenticated') {
		throw redirect({ to: '/login', search: { next: href } });
	}
}

export function requireRole(roles: string[]): void {
	if (!hasRole(roles)) {
		throw redirect({ to: '/forbidden' });
	}
}
