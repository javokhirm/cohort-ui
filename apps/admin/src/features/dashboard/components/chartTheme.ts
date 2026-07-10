import type { CSSProperties } from 'react';

/**
 * Chart styling driven by the design-system CSS variables (defined in
 * `@repo/ui/globals.css`), so the charts follow the theme in both light and dark
 * instead of hardcoding hex. recharts accepts `var(--…)` strings for
 * stroke/fill.
 */
export const CHART = {
	primary: 'var(--primary)',
	revenue: 'var(--tone-indigo-fg)',
	enrollment: 'var(--tone-blue-fg)',
	attendance: 'var(--tone-green-fg)',
	grid: 'var(--border)',
	axis: 'var(--muted-foreground)',
} as const;

/** Tooltip surface matching the popover token. */
export const TOOLTIP_STYLE: CSSProperties = {
	background: 'var(--popover)',
	border: '1px solid var(--border)',
	borderRadius: 'var(--radius-md)',
	color: 'var(--popover-foreground)',
	fontSize: 12,
	boxShadow: '0 4px 12px rgb(0 0 0 / 0.08)',
};

export const AXIS_TICK = { fill: 'var(--muted-foreground)', fontSize: 11 } as const;
