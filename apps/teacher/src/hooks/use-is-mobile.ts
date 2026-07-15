import { useSyncExternalStore } from 'react';

/** Below Tailwind's `md` breakpoint — matches the sidebar/bottom-tab split in `authed-layout.tsx`. */
const MOBILE_QUERY = '(max-width: 767px)';

function subscribe(listener: () => void): () => void {
	const mql = window.matchMedia(MOBILE_QUERY);
	mql.addEventListener('change', listener);
	return () => mql.removeEventListener('change', listener);
}

function getSnapshot(): boolean {
	return window.matchMedia(MOBILE_QUERY).matches;
}

/** Tracks whether the viewport is below the `md` breakpoint (768px), live across resizes. */
export function useIsMobile(): boolean {
	return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
