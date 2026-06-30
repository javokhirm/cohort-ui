import { redirect } from '@tanstack/react-router';

import { hasRole, useSessionStore } from '@/store/sessionStore';

/**
 * Route guards (docs/auth-and-rbac.md §7). UI gating is cosmetic — the backend
 * enforces every rule — but keeps unauthorized users out of the staff console.
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
