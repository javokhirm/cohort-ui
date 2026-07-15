import * as React from 'react';

export type Theme = 'light' | 'dark';

const DARK_QUERY = '(prefers-color-scheme: dark)';

/** Overwritten by `initTheme`; each app scopes its own key (`cohort.<app>.theme`). */
let storageKey = 'cohort.theme';
let theme: Theme = 'light';
let initialized = false;
const listeners = new Set<() => void>();

function prefersDark(): boolean {
	return window.matchMedia(DARK_QUERY).matches;
}

/** The user's explicit choice, or `null` while they are still following the OS. */
function readStoredTheme(): Theme | null {
	try {
		const value = localStorage.getItem(storageKey);
		return value === 'dark' || value === 'light' ? value : null;
	} catch {
		return null;
	}
}

/** `@repo/ui` defines both palettes; the `dark` class on <html> selects one. */
function applyTheme(next: Theme): void {
	theme = next;
	const root = document.documentElement;
	root.classList.toggle('dark', next === 'dark');
	// Keeps native chrome (scrollbars, form controls) in step with the palette.
	root.style.colorScheme = next;
	for (const listener of listeners) listener();
}

/**
 * Resolve and apply the theme, then keep following the OS for as long as the
 * user has not made an explicit choice.
 *
 * Call once from `main.tsx` before the first render. The inline script in the
 * app's `index.html` resolves the same value earlier still — that one exists to
 * beat the first paint, this one owns the state afterwards. Both read the same
 * `storageKey`, so if you change it here, change it there too.
 */
export function initTheme(options: { storageKey: string }): void {
	storageKey = options.storageKey;
	applyTheme(readStoredTheme() ?? (prefersDark() ? 'dark' : 'light'));

	if (initialized) return;
	initialized = true;

	window.matchMedia(DARK_QUERY).addEventListener('change', (event) => {
		if (readStoredTheme() === null) applyTheme(event.matches ? 'dark' : 'light');
	});
}

/** Record an explicit choice. From here on the OS no longer drives the theme. */
export function setTheme(next: Theme): void {
	try {
		localStorage.setItem(storageKey, next);
	} catch {
		/* storage unavailable — the choice just won't survive a reload */
	}
	applyTheme(next);
}

export function toggleTheme(): void {
	setTheme(theme === 'dark' ? 'light' : 'dark');
}

function subscribe(listener: () => void): () => void {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

function getSnapshot(): Theme {
	return theme;
}

interface UseThemeResult {
	theme: Theme;
	isDark: boolean;
	setTheme: (next: Theme) => void;
	toggleTheme: () => void;
}

export function useTheme(): UseThemeResult {
	const current = React.useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
	return { theme: current, isDark: current === 'dark', setTheme, toggleTheme };
}
