import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';

import { setLocale, useLocale, type Locale } from '@repo/i18n';

import { updateMyPreferences } from '@/api/me';
import { useSessionStore } from '@/store/sessionStore';

interface UseLocalePreferenceResult {
	locale: Locale;
	locales: readonly Locale[];
	/** Switch language now; persist to the server if signed in. */
	changeLocale: (next: Locale) => void;
	isSaving: boolean;
}

/**
 * The switcher's brain. Applies the chosen locale **optimistically** (local
 * state is the source of truth for what the user sees) and, when signed in,
 * fires `PATCH /me/preferences` so the choice persists to the DB and follows
 * the user to their other devices and the other consoles.
 *
 * A failed save is logged but never rolled back: the language the user just
 * picked still holds for this session, and the server simply keeps the previous
 * stored value until the next successful change. Anonymous users (login screen)
 * switch locally only — there is no session to attach the preference to yet.
 */
export function useLocalePreference(): UseLocalePreferenceResult {
	const { locale, locales } = useLocale();
	const isAuthenticated = useSessionStore((s) => s.status === 'authenticated');

	const mutation = useMutation({
		mutationFn: updateMyPreferences,
		onError: (error) => {
			console.error('Failed to persist language preference', error);
		},
	});

	const { mutate } = mutation;
	const changeLocale = useCallback(
		(next: Locale) => {
			if (next === locale) return;
			setLocale(next);
			if (isAuthenticated) mutate(next);
		},
		[locale, isAuthenticated, mutate],
	);

	return { locale, locales, changeLocale, isSaving: mutation.isPending };
}
