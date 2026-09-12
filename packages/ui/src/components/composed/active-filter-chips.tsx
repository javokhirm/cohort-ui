import * as React from 'react';
import { X } from 'lucide-react';

import { cn } from '@repo/ui/lib/utils';

export interface ActiveFilterChip {
	id: string;
	label: string;
	value: string;
	removeLabel: string;
	onRemove: () => void;
}

interface ActiveFilterChipsProps extends React.ComponentProps<'div'> {
	chips: ActiveFilterChip[];
	/** Trailing control, e.g. a "Clear filters" button. Only rendered alongside at least one chip. */
	action?: React.ReactNode;
}

/**
 * The row of removable chips naming every filter currently narrowing a list —
 * the readable counterpart to a <FilterPopover/> that has the controls hidden.
 *
 * It exists so a filtered list is never unexplained: a user who lands on one by
 * deep link can see what is being applied, drop any single filter without
 * losing the rest, and tell an empty result apart from an empty table.
 *
 * Renders nothing when no filter is applied, so it costs no vertical space on
 * the default view. Label and value are two spans, not one sentence — the
 * caller passes each already translated.
 */
function ActiveFilterChips({
	chips,
	action,
	className,
	...props
}: ActiveFilterChipsProps) {
	if (chips.length === 0) return null;

	return (
		<div
			data-slot="active-filter-chips"
			className={cn('flex flex-wrap items-center gap-2', className)}
			{...props}
		>
			{chips.map((chip) => (
				<span
					key={chip.id}
					className="flex h-8 items-center gap-1.5 rounded-xl border border-border bg-card pl-3 pr-1 text-xs"
				>
					<span className="text-muted-foreground">{chip.label}</span>
					<span className="max-w-50 truncate font-semibold text-foreground">
						{chip.value}
					</span>
					<button
						type="button"
						onClick={chip.onRemove}
						aria-label={chip.removeLabel}
						className="flex size-5 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
					>
						<X className="size-3.5" />
					</button>
				</span>
			))}
			{action}
		</div>
	);
}

export { ActiveFilterChips };
export type { ActiveFilterChipsProps };
