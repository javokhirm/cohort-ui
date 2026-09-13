import { useState, type ReactNode } from 'react';
import { SlidersHorizontal } from 'lucide-react';

import { Badge, Button, cn } from '@repo/ui';
import { useT } from '@repo/i18n';

import { FormSheet } from '@/components/FormSheet';

interface FilterSheetProps {
	/** Trigger label, also used as the sheet's title. */
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
	/** The filter controls, typically a stack of <FilterField/>, bound to the caller's draft state. */
	children: ReactNode;
	/** Commits the pending changes; the sheet closes right after. */
	onApply: () => void;
	/** Fires on every open/close transition — including Cancel, the X, Esc, and backdrop click — so the caller can (re)seed its draft state from what's currently applied whenever the sheet opens. */
	onOpenChange?: (open: boolean) => void;
	/** Left-aligned footer control, e.g. a "Clear filters" button. Pass it only while there is something to reset. */
	resetAction?: ReactNode;
	className?: string;
}

/**
 * Collapses a row of secondary list filters behind one trigger, opening a
 * right-side sheet (full-screen on small viewports) with the filter controls.
 *
 * Unlike a live popover, changes here are staged: the caller owns the draft
 * state that `children` reads from and writes to, and only commits it — via
 * `onApply` — once the user confirms. Cancelling (or dismissing the sheet any
 * other way) never calls `onApply`, so the draft is simply discarded; the
 * caller resyncs it from applied state in `onOpenChange` the next time the
 * sheet opens.
 *
 * Pair it with `<ActiveFilterChips/>` below the toolbar: the trigger says *how
 * many* filters are on, the chips say *which*, and neither hides the other.
 */
export function FilterSheet({
	label,
	count = 0,
	children,
	onApply,
	onOpenChange,
	resetAction,
	className,
}: FilterSheetProps) {
	const tc = useT('common');
	const [open, setOpen] = useState(false);
	const active = count > 0;

	function handleOpenChange(next: boolean) {
		setOpen(next);
		onOpenChange?.(next);
	}

	function handleApply() {
		onApply();
		handleOpenChange(false);
	}

	return (
		<>
			<Button
				type="button"
				variant="outline"
				className={cn(active && 'border-primary text-primary', className)}
				onClick={() => handleOpenChange(true)}
			>
				<SlidersHorizontal className="mr-1.5 size-4" />
				{label}
				{active && (
					<Badge className="ml-1.5 h-5 min-w-5 px-1 tabular-nums">
						{count}
					</Badge>
				)}
			</Button>
			<FormSheet
				open={open}
				onOpenChange={handleOpenChange}
				title={label}
				footer={
					<div className="flex w-full items-center justify-between gap-2">
						<div>{resetAction}</div>
						<div className="flex gap-2">
							<Button
								type="button"
								variant="outline"
								onClick={() => handleOpenChange(false)}
							>
								{tc('action.cancel')}
							</Button>
							<Button type="button" onClick={handleApply}>
								{tc('action.apply')}
							</Button>
						</div>
					</div>
				}
			>
				<div className="flex flex-col gap-4">{children}</div>
			</FormSheet>
		</>
	);
}
