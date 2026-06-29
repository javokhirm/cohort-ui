import { cn } from '@repo/ui/lib/utils';
import * as React from 'react';

export interface DetailRow {
	label: string;
	value: React.ReactNode;
	/** Optional lucide icon element shown in a tinted box to the left. */
	icon?: React.ReactNode;
}

interface DetailRowsProps extends React.ComponentProps<'div'> {
	rows: DetailRow[];
}

/**
 * Vertical list of label→value rows used in detail panels (student profile,
 * session detail, tenant settings). Each row optionally prefixes an icon chip.
 */
function DetailRows({ className, rows, ...props }: DetailRowsProps) {
	return (
		<div
			data-slot="detail-rows"
			className={cn('flex flex-col', className)}
			{...props}
		>
			{rows.map((row, i) => (
				<div
					key={i}
					className="flex items-center gap-3 border-b border-border py-3 last:border-0"
				>
					{row.icon && (
						<span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground [&>svg]:size-4">
							{row.icon}
						</span>
					)}
					<div className="min-w-0 flex-1">
						<div className="text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground">
							{row.label}
						</div>
						<div className="mt-0.5 text-sm font-semibold text-foreground">
							{row.value}
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

export { DetailRows };
export type { DetailRowsProps };
