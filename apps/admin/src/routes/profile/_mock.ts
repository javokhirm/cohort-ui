// TODO: replace with real API data once GET /admin/me/security endpoints exist.

export const MOCK_SECURITY = {
	twoFactor: {
		enabled: true,
		method: 'Authenticator app',
		enforced: true,
	},
	sessions: {
		count: 2,
		location: 'Tashkent',
	},
};
