import { create } from 'zustand';

import { setLocale } from '@repo/i18n';
import type { SubscriptionAccessView, SubscriptionBlockDetails } from '@repo/api-client';

import type { AuthResult, AuthUserSummary } from '@/lib/auth/types';
import { permitted, type PermissionRequirement } from '@/lib/auth/permissions';
import { clearStoredRefreshToken, setStoredRefreshToken } from '@/lib/auth/tokenStorage';

export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous';

/**
 * A fresh, authoritative read always wins: once `subscription.hasAccess` is
 * true, any 402 captured earlier is stale — drop it. Never the other
 * direction (a `hasAccess: true` read must never invent a block).
 */
function nextSubscriptionBlock(
	subscription: SubscriptionAccessView | null,
	current: SubscriptionBlockDetails | null,
): SubscriptionBlockDetails | null {
	return subscription?.hasAccess ? null : current;
}

interface SessionState {
	/** Access token — memory only, never persisted. */
	accessToken: string | null;
	user: AuthUserSummary | null;
	status: SessionStatus;
	/**
	 * Effective permission codes resolved from `GET /manage/me`. Empty until the
	 * profile loads; `permissionsLoaded` distinguishes "not yet fetched" from
	 * "fetched, holds nothing".
	 */
	permissions: string[];
	permissionsLoaded: boolean;
	/**
	 * The tenant's derived subscription access state — from login/refresh,
	 * `GET /manage/me`, or `GET /manage/subscription` itself. Never recompute
	 * expiry client-side; `hasAccess`/`state` are the server's verdict.
	 */
	subscription: SubscriptionAccessView | null;
	/**
	 * Set the instant any request comes back 402 (`error.details`) — lets the
	 * global block render immediately, without waiting on a second request.
	 * Cleared only by a fresh `subscription.hasAccess === true` read, never
	 * optimistically.
	 */
	subscriptionBlock: SubscriptionBlockDetails | null;
	setSession: (result: AuthResult) => void;
	/** Store the resolved permission codes (from `/manage/me`). */
	setPermissions: (codes: string[]) => void;
	/** Sync the subscription state from any endpoint that reports it. */
	setSubscription: (subscription: SubscriptionAccessView | null) => void;
	/** Record a 402's renewal essentials — the global block's trigger. */
	setSubscriptionBlock: (details: SubscriptionBlockDetails) => void;
	setAnonymous: () => void;
	clear: () => void;
}

export const useSessionStore = create<SessionState>((set) => ({
	accessToken: null,
	user: null,
	status: 'unknown',
	permissions: [],
	permissionsLoaded: false,
	subscription: null,
	subscriptionBlock: null,
	setSession: (result) => {
		setStoredRefreshToken(result.refreshToken);
		// Completes the user → tenant → localStorage → 'uz' chain: the server
		// already applied the tenant fallback, so a non-null value here is the
		// user's own choice and should win over what `initI18n` resolved from
		// localStorage. A `null` preference is ignored (setLocale no-ops).
		setLocale(result.user.preferredLanguage);
		set((state) => ({
			accessToken: result.accessToken,
			user: result.user,
			status: 'authenticated',
			subscription: result.subscription,
			subscriptionBlock: nextSubscriptionBlock(
				result.subscription,
				state.subscriptionBlock,
			),
		}));
	},
	setPermissions: (codes) => set({ permissions: codes, permissionsLoaded: true }),
	setSubscription: (subscription) =>
		set((state) => ({
			subscription,
			subscriptionBlock: nextSubscriptionBlock(
				subscription,
				state.subscriptionBlock,
			),
		})),
	setSubscriptionBlock: (details) => set({ subscriptionBlock: details }),
	setAnonymous: () =>
		set({
			accessToken: null,
			user: null,
			status: 'anonymous',
			permissions: [],
			permissionsLoaded: false,
			subscription: null,
			subscriptionBlock: null,
		}),
	clear: () => {
		clearStoredRefreshToken();
		set({
			accessToken: null,
			user: null,
			status: 'anonymous',
			permissions: [],
			permissionsLoaded: false,
			subscription: null,
			subscriptionBlock: null,
		});
	},
}));

export const getAccessToken = (): string | null => useSessionStore.getState().accessToken;

export const hasRole = (roles: string[]): boolean => {
	const { user } = useSessionStore.getState();
	return !!user && roles.some((role) => user.roles.includes(role));
};

/**
 * Non-reactive permission check (any-of) against the resolved catalog codes —
 * for use outside React (route guards). Components should prefer the reactive
 * `usePermissions()` / `<Can>` so they update when the profile loads.
 */
export const hasPermission = (required: PermissionRequirement): boolean => {
	return permitted(useSessionStore.getState().permissions, required);
};

/**
 * Non-reactive check for the route guard: true once either a live read says
 * `hasAccess: false` or a 402 has been captured. `subscription == null` (not
 * yet loaded) fails open, matching `requirePermission` — the server enforces
 * regardless of what the client has resolved yet.
 */
export const isSubscriptionBlocked = (): boolean => {
	const { subscription, subscriptionBlock } = useSessionStore.getState();
	if (subscriptionBlock != null) return true;
	return subscription != null && !subscription.hasAccess;
};
