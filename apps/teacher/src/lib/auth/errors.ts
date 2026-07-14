/**
 * `POST /public/auth/login` is shared by every console and does no role checking
 * — an admin's credentials authenticate here just as a teacher's do. The teach
 * API surface would then 403 every request. Rather than seat a non-teacher in a
 * console that cannot load anything, we reject at sign-in and say why.
 */
export class RoleNotAllowedError extends Error {
	readonly name = 'RoleNotAllowedError';

	constructor(message = 'This console is for teachers. Use the admin console instead.') {
		super(message);
	}
}

export function isRoleNotAllowedError(err: unknown): err is RoleNotAllowedError {
	return err instanceof RoleNotAllowedError;
}
