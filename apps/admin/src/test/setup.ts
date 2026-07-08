import '@testing-library/jest-dom/vitest';
import { afterAll, afterEach, beforeAll } from 'vitest';
import { cleanup } from '@testing-library/react';

import { useSessionStore } from '@/store/sessionStore';
import { useBranchStore } from '@/store/branchStore';
import { server } from './server';

// jsdom has no ResizeObserver; Radix's Sheet/Dialog/Select primitives need one.
class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));

afterEach(() => {
	server.resetHandlers();
	cleanup();
	localStorage.clear();
	useSessionStore.setState({
		accessToken: null,
		user: null,
		status: 'unknown',
		permissions: [],
		permissionsLoaded: false,
	});
	useBranchStore.setState({ activeBranchIds: null });
});

afterAll(() => server.close());
