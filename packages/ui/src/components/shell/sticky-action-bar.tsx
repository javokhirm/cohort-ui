import { cn } from '@repo/ui/lib/utils';
import * as React from 'react';

interface StickyActionBarProps extends React.ComponentProps<'div'> {
	/** Left-side status summary (e.g. "12 / 14 marked"). */
	status?: React.ReactNode;
	/** Secondary hint below the status (e.g. "Unsaved changes"). */
	hint?: React.ReactNode;
	/** Primary CTA — pass a `<Button>` element. */
	action: React.ReactNode;
}

/**
 * Fixed bottom bar that floats above page content. Used for the attendance
 * save bar (TEACH) and the invoice pay bar (PORTAL). Position it with
 * `position: sticky; bottom: 0` or `position: absolute; bottom: 0` inside a
 * relative/scroll container.
 */
function StickyActionBar({
	className,
	status,
	hint,
	action,
	...props
}: StickyActionBarProps) {
	return (
		<div
			data-slot="sticky-action-bar"
			className={cn(
				'flex items-center gap-3 border-t border-border bg-card px-4 py-3 shadow-[0_-8px_24px_-16px_rgba(15,23,42,0.35)]',
				className,
			)}
			{...props}
		>
			{(status || hint) && (
				<div className="min-w-0 flex-1">
					{status && (
						<div className="text-xs text-muted-foreground">{status}</div>
					)}
					{hint && (
						<div className="mt-0.5 text-[11px] text-muted-foreground/60">
							{hint}
						</div>
					)}
				</div>
			)}
			<div className="shrink-0">{action}</div>
		</div>
	);
}

export { StickyActionBar };
export type { StickyActionBarProps };
