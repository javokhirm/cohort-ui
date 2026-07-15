import { cn, Input } from '@repo/ui';

import type { SheetInputCell } from './types';

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
				'shrink-0 border-r border-border/60',
				cell.accent && 'border-l-2 border-l-primary',
			)}
			style={{ width }}
		>
			<Input
				value={cell.value}
				onChange={cell.onChange}
				style={{ fontSize }}
				className="h-full rounded-none border-0 bg-transparent text-center tabular-nums shadow-none focus-visible:border-transparent focus-visible:bg-primary/10 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-inset"
			/>
		</div>
	);
}
