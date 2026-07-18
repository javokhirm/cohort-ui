import { cn, Input } from '@repo/ui';

import type { SheetInputCell } from './types';

/**
 * An editable score cell, sized and shaped like `BadgeCell`'s chip so a marks
 * grid reads as one surface: a dashed field while empty (the same "tap me"
 * affordance the attendance sheet uses), solid and ringed once focused.
 */
export function InputCell({
	cell,
	width,
	fontSize,
}: {
	cell: SheetInputCell;
	width: string;
	fontSize: string;
}) {
	return (
		<div
			className={cn(
				'flex items-center justify-center border-r border-border/60 px-1.5',
				cell.accent && 'bg-primary/5',
			)}
			style={{ flex: `1 0 ${width}` }}
		>
			<Input
				value={cell.value}
				onChange={cell.onChange}
				onBlur={(e) => cell.onCommit?.(e.currentTarget.value)}
				onKeyDown={(e) => {
					if (e.key === 'Enter') e.currentTarget.blur();
				}}
				disabled={cell.disabled}
				aria-label={cell.label}
				type="number"
				inputMode={cell.inputMode}
				min={cell.min}
				max={cell.max}
				step={cell.step}
				placeholder="–"
				style={{ fontSize }}
				className={cn(
					'h-7 rounded-lg border-dashed border-primary/45 bg-transparent px-1 text-center font-bold tabular-nums shadow-none',
					'placeholder:font-normal placeholder:text-muted-foreground/40',
					'hover:border-primary hover:bg-primary/10',
					'focus-visible:border-solid focus-visible:border-primary focus-visible:bg-card focus-visible:ring-2 focus-visible:ring-primary/30',
				)}
			/>
		</div>
	);
}
