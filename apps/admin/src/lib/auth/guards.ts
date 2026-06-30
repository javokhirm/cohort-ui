import { hasRole, useSessionStore } from '@/store/sessionStore';
import { redirect } from '@tanstack/react-router';

/**
 * Route guards (docs/auth-and-rbac.md §7). UI gating is cosmetic — the backend
 * enforces every rule — but it keeps unauthorized users out of the console UI.
 * Run inside a route's `beforeLoad`; they throw a `redirect` on failure.
 */

/** Bounce to /login (preserving the destination) unless authenticated. */
export function requireAuth(href: string): void {
	if (useSessionStore.getState().status !== 'authenticated') {
		throw redirect({ to: '/login', search: { next: href } });
	}
}

/** Bounce to /forbidden unless the operator holds one of the roles. */
export function requireRole(roles: string[]): void {
	if (!hasRole(roles)) {
		throw redirect({ to: '/forbidden' });
	}
}
