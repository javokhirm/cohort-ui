import { StatusTone } from '@repo/ui/lib/status';
import { cn } from '@repo/ui/lib/utils';
import * as React from 'react';

const ACCENT_BORDER_COLOR: Record<StatusTone, string> = {
	green: 'border-l-tone-green-fg',
	red: 'border-l-tone-red-fg',
	amber: 'border-l-tone-amber-fg',
	blue: 'border-l-tone-blue-fg',
	violet: 'border-l-tone-violet-fg',
	slate: 'border-l-tone-slate-fg',
	indigo: 'border-l-tone-indigo-fg',
	cyan: 'border-l-tone-cyan-fg',
	pink: 'border-l-tone-pink-fg',
	orange: 'border-l-tone-orange-fg',
	yellow: 'border-l-tone-yellow-fg',
};

interface AccentCardProps extends React.ComponentProps<'div'> {
	/** Semantic tone drives the left-border colour via the token system. */
	tone?: StatusTone;
	/** Escape hatch: raw CSS color when a tone doesn't exist yet. */
	accentColor?: string;
}

/**
 * Card variant with a coloured 3px left border used for status-aware list
 * items (schedule cards in PORTAL, session lists in MANAGE).
 */
function AccentCard({ className, tone, accentColor, style, ...props }: AccentCardProps) {
	return (
		<div
			data-slot="accent-card"
			className={cn(
				'rounded-xl border border-l-[3px] border-border bg-card shadow-sm',
				tone ? ACCENT_BORDER_COLOR[tone] : '',
				className,
			)}
			style={accentColor ? { borderLeftColor: accentColor, ...style } : style}
			{...props}
		/>
	);
}

export { AccentCard };
export type { AccentCardProps };
