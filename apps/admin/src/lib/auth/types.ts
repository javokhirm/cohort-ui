/**
 * Admin auth contract types — mirror the backend interfaces
 * (educore-be `src/domain/identity/interfaces/auth-result.interface.ts` and
 * `operator-profile.interface.ts`).
 *
 * NOTE: the committed OpenAPI spec (packages/api-client/openapi.json) does not
 * yet expose the `/admin/*` surface, so these are hand-written. TODO: replace
 * with generated types from `@repo/api-client` once the spec is regenerated
 * (`pnpm gen:api` against a running backend).
 */

/** The `user` summary returned alongside the JWT pair. */
export interface AuthUserSummary {
	id: number;
	firstName: string;
	lastName: string;
	roles: string[];
	/** `null` = all branches. Operators are platform-wide, so typically `null`. */
	branchScope: number[] | null;
}

/** `data` of a successful login / verify-otp / refresh response. */
export interface AuthResult {
	accessToken: string;
	refreshToken: string;
	/** Access-token lifetime, in seconds. */
	expiresIn: number;
	user: AuthUserSummary;
}

/** `data` of step 1 (`POST /public/admin/auth/login`) — the OTP was emailed. */
export interface OtpChallenge {
	status: 'OTP_SENT';
}

/** `GET /admin/me` — the authenticated operator's profile (console bootstrap). */
export interface OperatorProfile {
	id: number;
	firstName: string;
	lastName: string;
	email: string | null;
	phone: string;
	/** Role names from the access token — always includes `SUPER_ADMIN`. */
	roles: string[];
}
