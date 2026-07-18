import type { StatusTone } from '@repo/ui';

/** The rate below which a student counts as at risk, and the summary/grid band. */
export const AT_RISK_RATE = 75;

/**
 * Tone band for an attendance rate (0–100): green from 90, amber from 75, red
 * below it; `null` (nothing to average yet) stays neutral. Shared by the grid's
 * RATE column and the page's summary so one number never reads two colours.
 */
export function rateTone(rate: number | null): StatusTone {
	if (rate === null) return 'slate';
	if (rate >= 90) return 'green';
	if (rate >= AT_RISK_RATE) return 'amber';
	return 'red';
}
