import { create } from 'zustand';

export type Theme = 'light' | 'dark';

const THEME_KEY = 'cohort.teacher.theme';

/** `@repo/ui` defines both palettes; the `dark` class on <html> selects one. */
function applyTheme(theme: Theme): void {
	document.documentElement.classList.toggle('dark', theme === 'dark');
}

function readStoredTheme(): Theme {
	try {
		return localStorage.getItem(THEME_KEY) === 'dark' ? 'dark' : 'light';
	} catch {
		return 'light';
	}
}

interface ThemeState {
	theme: Theme;
	setTheme: (theme: Theme) => void;
	toggleTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
	theme: readStoredTheme(),
	setTheme: (theme) => {
		applyTheme(theme);
		try {
			localStorage.setItem(THEME_KEY, theme);
		} catch {
			/* storage unavailable — theme just won't persist across reloads */
		}
		set({ theme });
	},
	toggleTheme: () => get().setTheme(get().theme === 'dark' ? 'light' : 'dark'),
}));

/**
 * Apply the persisted theme before first paint. Called from `main.tsx` so the
 * app never flashes light chrome on the way to a dark session.
 */
export function initTheme(): void {
	applyTheme(useThemeStore.getState().theme);
}
