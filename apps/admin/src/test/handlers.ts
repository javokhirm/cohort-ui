import { http, HttpResponse } from 'msw';

/** Mirrors the backend response envelope + admin auth contract for tests. */
const BASE = 'http://localhost:5050/api/v1';

function ok(data: unknown) {
	return HttpResponse.json({ success: true, data, meta: { timestamp: 'test' } });
}

function fail(status: number, code: string, message: string) {
	return HttpResponse.json(
		{ success: false, error: { code, message }, meta: { timestamp: 'test' } },
		{ status },
	);
}

/** The single valid operator credential set used across tests. */
export const VALID = {
	email: 'operator@educore.uz',
	password: 'S3cret-pass',
	code: '123456',
};

export const authResult = {
	accessToken: 'access-token-1',
	refreshToken: 'refresh-token-1',
	expiresIn: 900,
	user: {
		id: 1,
		firstName: 'Olim',
		lastName: 'Operator',
		roles: ['SUPER_ADMIN'],
		branchScope: null,
	},
};

export const operatorProfile = {
	id: 1,
	firstName: 'Olim',
	lastName: 'Operator',
	email: VALID.email,
	phone: '+998901234567',
	roles: ['SUPER_ADMIN'],
};

export const handlers = [
	http.post(`${BASE}/public/admin/auth/login`, async ({ request }) => {
		const body = (await request.json()) as { email: string; password: string };
		if (body.email === VALID.email && body.password === VALID.password) {
			return ok({ status: 'OTP_SENT' });
		}
		return fail(401, 'INVALID_CREDENTIALS', 'Invalid email or password.');
	}),

	http.post(`${BASE}/public/admin/auth/verify-otp`, async ({ request }) => {
		const body = (await request.json()) as { email: string; code: string };
		if (body.email === VALID.email && body.code === VALID.code) {
			return ok(authResult);
		}
		return fail(401, 'INVALID_OTP', 'Invalid or expired code.');
	}),

	http.post(`${BASE}/public/auth/refresh`, async ({ request }) => {
		const body = (await request.json()) as { refreshToken?: string };
		if (body.refreshToken) return ok(authResult);
		return fail(401, 'INVALID_TOKEN', 'Invalid refresh token.');
	}),

	http.get(`${BASE}/admin/me`, ({ request }) => {
		if (request.headers.get('Authorization') === `Bearer ${authResult.accessToken}`) {
			return ok(operatorProfile);
		}
		return fail(401, 'UNAUTHORIZED', 'Unauthorized.');
	}),
];
