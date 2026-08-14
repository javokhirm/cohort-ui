import { redirect } from '@tanstack/react-router';

import {
	hasPermission,
	hasRole,
	isSubscriptionBlocked,
	useSessionStore,
} from '@/store/sessionStore';
import type { PermissionRequirement } from '@/lib/auth/permissions';

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

/**
 * Redirect to /forbidden unless the session holds the required permission(s)
 * (any-of). Fails **open** while permissions are still loading
 * (`permissionsLoaded === false`) so a signed-in user is never bounced on entry
 * before `/manage/me` resolves — the server enforces regardless.
 */
export function requirePermission(required: PermissionRequirement): void {
	if (!useSessionStore.getState().permissionsLoaded) return;
	if (!hasPermission(required)) {
		throw redirect({ to: '/forbidden' });
	}
}

/**
 * The global 402 block. Redirects to the full-page `/subscription` screen
 * whenever the tenant's access is blocked — run from `authedRoute.beforeLoad`
 * so it covers every nested route, including one reached by typing a URL
 * directly. `/subscription` itself is exempt so the block screen can render;
 * an in-flight request that 402s mid-session is caught separately by the
 * query/mutation cache (`api/queryClient.ts`), which navigates immediately
 * instead of waiting for the next route change.
 */
export function requireSubscriptionAccess(pathname: string): void {
	if (pathname === '/subscription') return;
	if (isSubscriptionBlocked()) {
		throw redirect({ to: '/subscription' });
	}
}
