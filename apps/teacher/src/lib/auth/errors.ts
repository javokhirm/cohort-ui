/**
 * `POST /public/auth/login` is shared by every console. The backend now gates
 * it on the `x-client-app` header we send, so a non-teacher is refused there with
 * 403 `CONSOLE_ROLE_NOT_ALLOWED` and never reaches this error.
 *
 * This stays as the client-side fallback: if a session ever reaches the store
 * without having passed that server gate, we still refuse to seat a
 * non-teacher in a console whose every request would 403.
 */
export class RoleNotAllowedError extends Error {
	readonly name = 'RoleNotAllowedError';

	constructor(
		message = 'This console is for teachers. Use the admin console instead.',
	) {
		super(message);
	}
}

export function isRoleNotAllowedError(err: unknown): err is RoleNotAllowedError {
	return err instanceof RoleNotAllowedError;
}
