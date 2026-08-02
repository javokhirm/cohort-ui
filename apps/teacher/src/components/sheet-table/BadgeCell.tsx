import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { createPortal } from 'react-dom';

import { Button, cn, TONE_ACCENT_CLASSES, TONE_CLASSES } from '@repo/ui';

import type { SheetBadgeCell } from './types';
import { useDropdownPosition } from './use-dropdown-position';

/**
 * The status popover's footprint, used only to decide whether it flips above
 * the cell. Keep in step with the panel's `w-*` and its options' padding below.
 */
const DROP_W_PX = 136;
const DROP_OPTION_H_PX = 30;
const DROP_PAD_PX = 12;

/**
 * One grid cell rendered as a tone chip centered in its column, so the cell's
 * own surface (today's tint, the row stripe) stays visible around it. An
 * unmarked editable cell shows a dashed placeholder — the affordance that says
 * "tap me" — while an unmarked read-only one shows a faint dash.
 */
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
	const coords = useDropdownPosition(open, cellRef, {
		width: DROP_W_PX,
		height: (dropOpts?.length ?? 0) * DROP_OPTION_H_PX + DROP_PAD_PX,
	});
	const marked = cell.letter !== '';

	let chip: React.ReactNode;
	if (marked) {
		chip = (
			<span
				className={cn(
					'inline-flex min-w-6.5 items-center justify-center rounded-lg px-1.5 py-1 leading-none font-bold',
					TONE_CLASSES[cell.tone],
				)}
				style={{ fontSize }}
			>
				{cell.letter}
			</span>
		);
	} else if (clickable) {
		chip = (
			<span className="inline-block size-6.5 rounded-lg border border-dashed border-primary/45 transition-colors group-hover/cell:border-primary group-hover/cell:bg-primary/10" />
		);
	} else {
		chip = (
			<span className="leading-none text-muted-foreground/35" style={{ fontSize }}>
				–
			</span>
		);
	}

	return (
		<div
			ref={cellRef}
			className={cn(
				'flex items-center justify-center border-r border-border/60',
				cell.accent && 'bg-primary/5',
			)}
			style={{ flex: `1 0 ${width}` }}
		>
			{clickable ? (
				<Button
					type="button"
					variant="ghost"
					onClick={cell.onClick}
					aria-label={cell.label}
					aria-haspopup="menu"
					aria-expanded={open}
					className="group/cell h-full w-full rounded-none p-0 hover:bg-primary/10"
				>
					{chip}
				</Button>
			) : (
				chip
			)}
			{open &&
				coords &&
				dropOpts &&
				createPortal(
					<div
						role="menu"
						className="animate-in fade-in-0 zoom-in-95 fixed z-50 w-34 rounded-xl border border-border bg-card p-1.5 shadow-lg duration-100"
						style={{ top: coords.top, left: coords.left }}
					>
						{dropOpts.map((opt, i) => (
							<Button
								key={i}
								type="button"
								role="menuitemradio"
								aria-checked={opt.selected}
								variant="ghost"
								onClick={opt.onSelect}
								className={cn(
									'h-auto w-full justify-start gap-2 rounded-lg px-2.5 py-1.5 font-semibold',
									opt.selected && 'bg-muted',
									opt.destructive &&
										'mt-1 rounded-t-none border-t border-border pt-2 hover:bg-destructive/10',
								)}
							>
								{opt.destructive ? (
									<Trash2 className="size-3.5 shrink-0 text-destructive" />
								) : (
									<span
										className={cn(
											'size-2 shrink-0 rounded-full',
											TONE_ACCENT_CLASSES[opt.tone].dot,
										)}
									/>
								)}
								<span
									className={cn(
										'text-[12.5px]',
										opt.destructive
											? 'text-destructive'
											: 'text-foreground',
									)}
								>
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
