import { useCallback } from 'react';
import { useMutation } from '@tanstack/react-query';

import { setLocale, useLocale, type Locale } from '@repo/i18n';

import { updateMyPreferences } from '@/api/preferences';
import { useSessionStore } from '@/store/sessionStore';

interface UseLocalePreferenceResult {
	locale: Locale;
	locales: readonly Locale[];
	changeLocale: (next: Locale) => void;
	isSaving: boolean;
}

/**
 * Switches the UI language immediately (optimistic) and, when signed in, persists
 * it to `PATCH /super-admin/me/preferences` so the choice follows the operator
 * across devices. A failed save is logged, never rolled back. Anonymous (login
 * screen) switches locally only.
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
