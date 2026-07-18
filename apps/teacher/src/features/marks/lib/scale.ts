import type { StatusTone } from '@repo/ui';

import type { LetterGrade, MarkConfig } from '../api/marks.queries';

/**
 * Grading-scale helpers for the marks screens. The backend is the source of
 * truth for validation and normalization (`session-mark-math`); these mirror it
 * for display, optimistic updates, and light client-side input constraints.
 */

/** Per-letter percentage — mirrors the backend `LETTER_PCT` constant. */
const LETTER_PCT: Record<LetterGrade, number> = { A: 95, B: 85, C: 75, D: 65, F: 50 };

/** A short label for a scale, e.g. "Points · max 10" / "Percentage · 0–100" / "Letter · A–F". */
export function scaleLabel(config: MarkConfig): string {
	switch (config.type) {
		case 'POINTS':
			return `Points · max ${config.maxPoints ?? '—'}`;
		case 'PERCENTAGE':
			return `Percentage · 0–${config.maxPoints ?? 100}`;
		case 'LETTER':
			return 'Letter grade · A–F';
	}
}

/**
 * The compact form for a header or list row, e.g. "Points /10", "Percentage /100",
 * "Letter A–F" — where `scaleLabel` is the fuller sentence used inside the sheet.
 */
export function scaleShortLabel(config: MarkConfig): string {
	switch (config.type) {
		case 'POINTS':
			return `Points /${config.maxPoints ?? '—'}`;
		case 'PERCENTAGE':
			return `Percentage /${config.maxPoints ?? 100}`;
		case 'LETTER':
			return 'Letter A–F';
	}
}

/** Whether a config accepts letters (vs a bounded numeric score). */
export function isLetterScale(config: MarkConfig): boolean {
	return config.type === 'LETTER';
}

/** Tone band for a 0–100 percentage (green ≥ 90, amber ≥ 75, else red; null → slate). */
export function scoreTone(pct: number | null): StatusTone {
	if (pct === null) return 'slate';
	if (pct >= 90) return 'green';
	if (pct >= 75) return 'amber';
	return 'red';
}

/**
 * The 0–100 normalized percentage a value would produce, for optimistic display
 * (the server recomputes authoritatively). POINTS/PERCENTAGE → raw/max × 100;
 * LETTER → the band representative.
 */
export function normalizedPctFor(
	config: MarkConfig,
	value: { rawScore?: number | null; letter?: string | null },
): number {
	if (config.type === 'LETTER') {
		return LETTER_PCT[value.letter as LetterGrade] ?? 0;
	}
	const max = config.maxPoints ?? 0;
	if (max <= 0 || value.rawScore == null) return 0;
	return Math.round(((value.rawScore / max) * 100 + Number.EPSILON) * 100) / 100;
}

/**
 * Parse a numeric-score input string into a value or `null` (empty/invalid).
 * Does not clamp — the `<Input>` constrains min/max/step and the server is
 * authoritative — but rejects non-finite input so a stray keystroke isn't sent.
 */
export function parseScoreInput(raw: string): number | null {
	const trimmed = raw.trim();
	if (trimmed === '') return null;
	const n = Number(trimmed);
	return Number.isFinite(n) ? n : null;
}

/** The editable string for a mark: its numeric score, its letter, or "". */
export function markDisplay(value: {
	rawScore?: number | null;
	letter?: string | null;
}): string {
	if (value.rawScore != null) return String(value.rawScore);
	return value.letter ?? '';
}
