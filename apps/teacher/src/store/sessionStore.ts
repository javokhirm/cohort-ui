import { create } from 'zustand';

import { setLocale } from '@repo/i18n';
import type { SubscriptionAccessView, SubscriptionBlockDetails } from '@repo/api-client';

import type { AuthResult, AuthUserSummary } from '@/lib/auth/types';
import { clearStoredRefreshToken, setStoredRefreshToken } from '@/lib/auth/tokenStorage';

/** `unknown` until the boot refresh resolves — the router waits for this. */
export type SessionStatus = 'unknown' | 'authenticated' | 'anonymous';

/**
 * A fresh, authoritative read always wins: once `subscription.hasAccess` is true,
 * any 402 captured earlier is stale — drop it. Never the other direction (a
 * `hasAccess: true` read must never invent a block).
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
	 * The tenant's derived subscription state, from the login/refresh response.
	 * Never recompute expiry client-side; `hasAccess`/`state` are the server's
	 * verdict. Drives the full-screen block when `hasAccess === false`.
	 */
	subscription: SubscriptionAccessView | null;
	/**
	 * Set the instant any teach request comes back 402 (`error.details`) — lets the
	 * block render immediately when a subscription lapses mid-session, without
	 * waiting on a fresh login/refresh. Cleared only by a later
	 * `subscription.hasAccess === true` read, never optimistically.
	 */
	subscriptionBlock: SubscriptionBlockDetails | null;
	setSession: (result: AuthResult) => void;
	/** Record a 402's renewal essentials — the block's trigger. */
	setSubscriptionBlock: (details: SubscriptionBlockDetails) => void;
	setAnonymous: () => void;
	clear: () => void;
}

/**
 * The teach surface is gated by **role only** — it carries no permission codes,
 * and there is no `/teach/me` boot fetch to resolve them from. So unlike the admin
 * console, this store holds no `permissions`: `user.roles` from the login/refresh
 * response is the whole authorization picture the client ever sees. It does track
 * the tenant `subscription`, which login/refresh reports for every surface.
 */
export const useSessionStore = create<SessionState>((set) => ({
	accessToken: null,
	user: null,
	status: 'unknown',
	subscription: null,
	subscriptionBlock: null,
	setSession: (result) => {
		setStoredRefreshToken(result.refreshToken);
		// user → tenant → localStorage → 'uz': the server already applied the
		// tenant fallback, so a non-null value here is the teacher's own choice.
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
	setSubscriptionBlock: (details) => set({ subscriptionBlock: details }),
	setAnonymous: () =>
		set({
			accessToken: null,
			user: null,
			status: 'anonymous',
			subscription: null,
			subscriptionBlock: null,
		}),
	clear: () => {
		clearStoredRefreshToken();
		set({
			accessToken: null,
			user: null,
			status: 'anonymous',
			subscription: null,
			subscriptionBlock: null,
		});
	},
}));

/** Non-React access for the api-client token getter and route guards. */
export const getAccessToken = (): string | null => useSessionStore.getState().accessToken;

export const hasRole = (roles: string[]): boolean => {
	const { user } = useSessionStore.getState();
	return !!user && roles.some((role) => user.roles.includes(role));
};

/**
 * The center's plan has lapsed: true once either a login/refresh read says
 * `hasAccess: false` or a 402 has been captured. `subscription == null` (not yet
 * loaded) is treated as not-blocked — the server enforces regardless.
 */
export const isSubscriptionBlocked = (): boolean => {
	const { subscription, subscriptionBlock } = useSessionStore.getState();
	if (subscriptionBlock != null) return true;
	return subscription != null && !subscription.hasAccess;
};
