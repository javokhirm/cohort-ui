/**
 * Teacher auth contract — the `/public/auth/*` surface is shared by every staff
 * console, so this mirrors the admin app's contract exactly. Login uses phone +
 * password (no 2FA step); the tenant is resolved by the backend from the user's
 * single membership (one user = one business) — it is never sent by the client.
 *
 * There is no `/teach/me`: `/manage/me` is gated to OWNER/ADMIN/MANAGER and 403s
 * for a teacher. The signed-in teacher's identity therefore comes from this
 * `user` summary on the login/refresh response and nowhere else.
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
