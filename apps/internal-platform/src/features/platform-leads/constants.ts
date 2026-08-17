import type { StatusTone } from '@repo/ui';

import type { useAppT } from '@/locales';

export const PAGE_SIZE = 20;

/**
 * Sources known today, for the filter dropdown and badge tone map.
 * `source` itself is an open-ended string on the backend (new capture points
 * can send a new value with no migration) — extend this list (and its i18n
 * key + tone below) as new sources ship a console-facing badge/filter for
 * themselves; an unlisted value still displays (falls back to a neutral tone
 * and its raw value as the label), it just isn't offered as a filter option.
 */
export const KNOWN_PLATFORM_LEAD_SOURCES = ['WEBSITE'] as const;

export const PLATFORM_LEAD_SOURCE_TONE: Record<string, StatusTone> = {
	WEBSITE: 'indigo',
};

export function platformLeadSourceLabel(
	t: ReturnType<typeof useAppT<'leads'>>,
	source: string,
): string {
	switch (source) {
		case 'WEBSITE':
			return t('source.website');
		default:
			return source;
	}
}

/** Options-builder for the source filter `Select`, `all` first. */
export function buildSourceOptions(
	t: ReturnType<typeof useAppT<'leads'>>,
): { value: string; label: string }[] {
	return [
		{ value: 'all', label: t('filter.allSources') },
		...KNOWN_PLATFORM_LEAD_SOURCES.map((source) => ({
			value: source,
			label: platformLeadSourceLabel(t, source),
		})),
	];
}
