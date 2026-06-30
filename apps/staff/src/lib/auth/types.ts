/**
 * Staff auth contract — mirrors the backend interface for the /manage surface.
 * Login uses phone + password (no 2FA step); the tenant is inferred from the
 * request subdomain (Host header), not the login body.
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
