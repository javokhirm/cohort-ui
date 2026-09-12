import type { ReactNode } from 'react';

import { cn, Label } from '@repo/ui';

interface FilterFieldProps {
	label: string;
	/** Ties the label to the control it describes — pass the control's `id`. */
	htmlFor?: string;
	children: ReactNode;
	className?: string;
}

/**
 * One labelled control in a filter surface — a <FilterPopover/> body, or a
 * filter row. Exists so the label/control stack is written once rather than
 * repeated per filter, and so every filter on every screen sizes its label the
 * same way.
 */
export function FilterField({ label, htmlFor, children, className }: FilterFieldProps) {
	return (
		<div className={cn('flex flex-col gap-1.5', className)}>
			<Label htmlFor={htmlFor} className="text-xs text-muted-foreground">
				{label}
			</Label>
			{children}
		</div>
	);
}
