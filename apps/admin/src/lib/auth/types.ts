/**
 * Staff auth contract — mirrors the backend interface for the /manage surface.
 * Login uses phone + password (no 2FA step); the tenant is resolved by the
 * backend from the user's single membership (one user = one business) — it is
 * never sent by the client.
 */
import type { Locale } from '@repo/utils';

export interface AuthUserSummary {
	id: number;
	firstName: string;
	lastName: string;
	roles: string[];
	/** null = all branches; array = restricted to those branch ids. */
	branchScope: number[] | null;
	/**
	 * The user's stored UI language, or `null` if they have never chosen one
	 * (the backend already falls back to the tenant default before returning).
	 * Applied to the active locale by the session store on sign-in.
	 */
	preferredLanguage: Locale | null;
}

export interface AuthResult {
	accessToken: string;
	refreshToken: string;
	/** Access-token lifetime in seconds. */
	expiresIn: number;
	user: AuthUserSummary;
}
