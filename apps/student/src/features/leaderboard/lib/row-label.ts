import type { AppTFunction } from '@repo/i18n';

import type { StudentLeaderboardRow } from '../api/leaderboard.queries';
import type { uz } from '@/locales/uz';

/** This feature's translator — `useAppT('leaderboard')`. */
export type LeaderboardT = AppTFunction<(typeof uz)['leaderboard']>;

/**
 * What a row is called on screen.
 *
 * Three cases, in priority order: my own row is always "You", a named peer
 * shows the short name the server allowed, and everyone else is labelled by
 * their **position in the list** ("Student 4").
 *
 * Position, not rank. Ranks are shared by tied students, so numbering by rank
 * puts five rows reading "Student 5" on top of each other; position is unique
 * per row, and the rank column beside it still shows the true (tied) placing.
 * Numbering off the list rather than off any identifier is what keeps the
 * anonymity real — the server sends no peer id, so there is nothing stable to
 * recognise a classmate by across requests.
 */
export function rowLabel(
	row: StudentLeaderboardRow,
	t: LeaderboardT,
	position: number,
): string {
	if (row.isMe) return t('you');
	if (row.displayName) return row.displayName;
	return t('anonymous', { rank: position });
}

/**
 * Up to two initials for a row's avatar. An anonymous row has no name to draw
 * from, so it falls back to `#` rather than exposing anything.
 */
export function rowInitials(row: StudentLeaderboardRow, label: string): string {
	if (!row.isMe && !row.displayName) return '#';
	const parts = label.trim().split(/\s+/);
	const two = (parts[0]?.[0] ?? '') + (parts[1]?.[0] ?? '');
	return two.toUpperCase() || '?';
}
