import * as React from 'react';
import { createPortal } from 'react-dom';

import { Button, cn, TONE_ACCENT_CLASSES, TONE_CLASSES } from '@repo/ui';

import type { SheetBadgeCell } from './types';
import { useDropdownPosition } from './use-dropdown-position';

export function BadgeCell({
	cell,
	width,
	fontSize,
}: {
	cell: SheetBadgeCell;
	width: string;
	fontSize: string;
}) {
	const clickable = Boolean(cell.onClick);
	const cellRef = React.useRef<HTMLDivElement>(null);
	const dropOpts = cell.dropOpts;
	const open = Boolean(cell.isOpen && dropOpts && dropOpts.length > 0);
	const coords = useDropdownPosition(open, cellRef);

	const content = (
		<span
			className={cn(
				'flex h-full w-full items-center justify-center font-bold transition-[filter]',
				clickable && 'hover:brightness-95',
				TONE_CLASSES[cell.tone],
			)}
			style={{ fontSize, opacity: cell.opacity ?? 1 }}
		>
			{cell.letter}
		</span>
	);

	return (
		<div
			ref={cellRef}
			className={cn(
				'shrink-0 border-r border-border/60',
				cell.accent && 'border-l-2 border-l-primary',
			)}
			style={{ width }}
		>
			{clickable ? (
				<Button
					type="button"
					variant="ghost"
					onClick={cell.onClick}
					className="h-full w-full rounded-none p-0"
				>
					{content}
				</Button>
			) : (
				content
			)}
			{open &&
				coords &&
				dropOpts &&
				createPortal(
					<div
						className="animate-in fade-in-0 zoom-in-95 fixed z-50 w-31.5 rounded-[10px] border border-border bg-card p-1.5 shadow-lg duration-100"
						style={{ top: coords.top, left: coords.left }}
					>
						{dropOpts.map((opt, i) => (
							<Button
								key={i}
								type="button"
								variant="ghost"
								onClick={opt.onSelect}
								className={cn(
									'h-auto w-full justify-start gap-2 rounded-md px-2.5 py-1.5 font-semibold',
									opt.selected && 'bg-muted/60',
								)}
							>
								<span
									className={cn(
										'size-2 shrink-0 rounded-full',
										TONE_ACCENT_CLASSES[opt.tone].dot,
									)}
								/>
								<span className="text-[12.5px] text-foreground">
									{opt.label}
								</span>
							</Button>
						))}
					</div>,
					document.body,
				)}
		</div>
	);
}
