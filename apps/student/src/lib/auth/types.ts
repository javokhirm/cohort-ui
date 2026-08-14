/**
 * Student auth contract. Login is a dedicated `POST /public/auth/student/login` (student
 * code + password, no 2FA step) — distinct from the shared phone-based `/auth/login` the
 * staff consoles use, since many students share a guardian's phone number. Refresh
 * (`/public/auth/refresh`) is the shared endpoint every console uses. The tenant is
 * resolved by the backend from the user's single membership (one user = one business) —
 * it is never sent by the client.
 *
 * The signed-in student's identity comes from this `user` summary on the login/refresh
 * response — there is no boot profile fetch on this surface (mirrors `apps/teacher`).
 * `PATCH /student/me` exists to persist a language change; it is a write, not the
 * identity source.
 */
import type { Locale } from '@repo/utils';
import type { SubscriptionAccessView } from '@repo/api-client';

export interface AuthUserSummary {
	id: number;
	firstName: string;
	lastName: string;
	roles: string[];
	/** null = all branches; array = restricted to those branch ids. */
	branchScope: number[] | null;
	/** Stored UI language, or `null` if never chosen. Applied on sign-in. */
	preferredLanguage: Locale | null;
}

export interface AuthResult {
	accessToken: string;
	refreshToken: string;
	/** Access-token lifetime in seconds. */
	expiresIn: number;
	user: AuthUserSummary;
	/**
	 * The tenant's derived subscription state at login/refresh time. An expired
	 * center still authenticates successfully and receives a full token pair — the
	 * account is valid, only the application access its plan grants is not. The
	 * client reads `subscription.hasAccess` to decide between the app and the
	 * full-screen block, and gets `state`/`currentPeriodEnd`/plan to render it
	 * without a second call. `null` only for the platform tenant, which this app
	 * never is.
	 */
	subscription: SubscriptionAccessView | null;
}
