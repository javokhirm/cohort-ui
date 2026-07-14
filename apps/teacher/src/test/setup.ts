import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

import { useSessionStore } from '@/store/sessionStore';

// jsdom has no ResizeObserver; Radix's Dropdown/Dialog primitives need one.
class ResizeObserverStub {
	observe() {}
	unobserve() {}
	disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverStub as unknown as typeof ResizeObserver;

afterEach(() => {
	cleanup();
	localStorage.clear();
	useSessionStore.setState({ accessToken: null, user: null, status: 'unknown' });
});
