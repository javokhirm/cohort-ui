export class ApiError extends Error {
	readonly name = 'ApiError';

	constructor(
		readonly code: string,
		message: string,
		readonly status: number,
		readonly details?: Record<string, unknown>,
	) {
		super(message);
	}
}

export function isApiError(err: unknown): err is ApiError {
	return err instanceof ApiError;
}
