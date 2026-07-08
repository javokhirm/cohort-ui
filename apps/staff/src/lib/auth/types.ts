/**
 * Staff auth contract — mirrors the backend interface for the /manage surface.
 * Login uses phone + password (no 2FA step); the tenant is resolved by the
 * backend from the user's single membership (one user = one business) — it is
 * never sent by the client.
 */

export interface AuthUserSummary {
	id: number;
	firstName: string;
	lastName: string;
	roles: string[];
	/** null = all branches; array = restricted to those branch ids. */
	branchScope: number[] | null;
}

export interface AuthResult {
	accessToken: string;
	refreshToken: string;
	/** Access-token lifetime in seconds. */
	expiresIn: number;
	user: AuthUserSummary;
}
