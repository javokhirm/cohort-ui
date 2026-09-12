import type { ReactNode } from 'react';
import { SlidersHorizontal } from 'lucide-react';

import { Badge, Button, cn, Popover, PopoverContent, PopoverTrigger } from '@repo/ui';

interface FilterPopoverProps {
	/** Trigger label, e.g. "Filters". */
	label: string;
	/**
	 * How many filters are currently applied. Shown as a badge on the trigger and
	 * drives its active styling; `0` renders a plain trigger with no badge.
	 *
	 * Count what the user can *see* they have applied — if two controls collapse
	 * into one <ActiveFilterChips/> chip (a date range, say), count them as one,
	 * so the badge and the chip row never disagree.
	 */
	count?: number;
	/** The filter controls, typically a stack of <FilterField/>. */
	children: ReactNode;
	/** Footer control, e.g. a "Clear filters" button. Only rendered while `count > 0`. */
	footer?: ReactNode;
	align?: 'start' | 'center' | 'end';
	/** Overrides the popover body, e.g. to widen it past the default `w-80`. */
	contentClassName?: string;
	className?: string;
}

/**
 * Collapses a row of secondary list filters behind one trigger, so a toolbar
 * stays scannable no matter how many filters a screen offers.
 *
 * Purely presentational and uncontrolled: it renders the controls it is given
 * and owns nothing but its own open state. Filters apply as the caller's
 * controls change — there is no Apply button, so the list stays live and the
 * popover is never a form to submit.
 *
 * Pair it with `<ActiveFilterChips/>` below the toolbar: the trigger says *how
 * many* filters are on, the chips say *which*, and neither hides the other.
 *
 * Nested pickers are safe here. A picker's own popover portals its content to
 * the body, but React events still propagate through the React tree, so Radix's
 * layer sees the interaction as inside this panel and keeps it open.
 */
export function FilterPopover({
	label,
	count = 0,
	children,
	footer,
	align = 'end',
	contentClassName,
	className,
}: FilterPopoverProps) {
	const active = count > 0;

	return (
		<Popover>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					className={cn(active && 'border-primary text-primary', className)}
				>
					<SlidersHorizontal className="mr-1.5 size-4" />
					{label}
					{active && (
						<Badge className="ml-1.5 h-5 min-w-5 px-1 tabular-nums">
							{count}
						</Badge>
					)}
				</Button>
			</PopoverTrigger>
			<PopoverContent align={align} className={cn('w-80 p-0', contentClassName)}>
				<div className="flex flex-col gap-4 p-4">{children}</div>
				{active && footer && (
					<div className="flex justify-end border-t border-border px-4 py-2.5">
						{footer}
					</div>
				)}
			</PopoverContent>
		</Popover>
	);
}
