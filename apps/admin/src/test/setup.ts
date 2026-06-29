import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';

import { useSessionStore } from '@/lib/auth/session-store';
import { server } from './server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
	server.resetHandlers();
	cleanup();
	localStorage.clear();
	useSessionStore.setState({ accessToken: null, user: null, status: 'unknown' });
});

afterAll(() => server.close());
