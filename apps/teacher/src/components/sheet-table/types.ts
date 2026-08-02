import type * as React from 'react';

import type { StatusTone } from '@repo/ui';

/** One header in the scrolling middle region (a date or session). */
export interface SheetDateColumn {
	/** Primary line — the day of the month, e.g. "3". */
	label: string;
	/** Secondary line above the label, e.g. the short weekday "Wed". */
	sublabel?: string;
	/** Marks this column as today: tinted and emphasised (not the only editable one — past columns are editable too). */
	accent?: boolean;
	/** Dims the column, e.g. a cancelled session. */
	muted?: boolean;
	/** Accessible/hover description of the column, e.g. "Wednesday, 3 June". */
	title?: string;
}

/** One option in a badge cell's status-picker popover. */
export interface SheetDropOption {
	label: string;
	tone: StatusTone;
	selected?: boolean;
	/** Renders as a divided, red "remove" row (icon instead of the tone dot) — e.g. "Clear mark". */
	destructive?: boolean;
	onSelect: () => void;
}

/** A colored chip centered in its cell — the attendance-sheet cell kind. */
export interface SheetBadgeCell {
	kind: 'badge';
	/** The chip's text; `""` renders the unmarked placeholder instead. */
	letter: string;
	tone: StatusTone;
	/** Sits in today's column — tints the cell and invites a tap when empty. */
	accent?: boolean;
	/** Present only when this cell is editable; clicking it opens `dropOpts`. */
	onClick?: () => void;
	/** Popover open state — owned by the parent, not this component. */
	isOpen?: boolean;
	dropOpts?: SheetDropOption[];
	/** Screen-reader label — the letter alone is meaningless out of context. */
	label?: string;
}

/** A borderless centered text input — the daily-marks-sheet cell kind. */
export interface SheetInputCell {
	kind: 'input';
	value: string;
	onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	/** Fired on blur and Enter with the field's current value — commit the edit. */
	onCommit?: (value: string) => void;
	accent?: boolean;
	/** Non-editable placeholder (e.g. a past column that only displays a value). */
	disabled?: boolean;
	/** Numeric-input constraints for a score cell. */
	inputMode?: React.HTMLAttributes<HTMLInputElement>['inputMode'];
	min?: number;
	max?: number;
	step?: number;
	/** Screen-reader label — the cell carries no visible one. */
	label?: string;
}

export type SheetCell = SheetBadgeCell | SheetInputCell;

/** One row's value in a right-hand summary column (e.g. Rate, Avg, Rank). */
export interface SheetRightValue {
	tone: StatusTone;
	disp: string;
	/** Bold/larger styling for a primary metric (Rate, Avg) vs a plain one (Rank). */
	emphasis?: boolean;
	/** Render as a tone-filled pill (Rate, Avg) vs plain text (Rank). Defaults to true. */
	pill?: boolean;
}

/** A right-hand summary column header; its width/divider also apply to that column's values. */
export interface SheetRightColumn {
	label: string;
	/** Fixed width; defaults to `64px`. The frozen right block is sized from these. */
	width?: string;
	divider?: boolean;
}

export interface SheetRow {
	key: string | number;
	name: string;
	/** Zebra-stripe this row. */
	striped?: boolean;
	cells: SheetCell[];
	right: SheetRightValue[];
}

export interface SheetTableProps {
	/** Left (row-label) column width, e.g. "168px". */
	nameW: string;
	/** Header row height, e.g. "40px". */
	headH: string;
	/** Body row height, e.g. "44px". */
	rowH: string;
	nameFont: string;
	/**
	 * Minimum width of each date/session column. Columns share any width left
	 * over once the frozen columns are placed, so a short month fills the card
	 * instead of trailing a dead gap before the summary block.
	 */
	cellW: string;
	cellFont: string;
	dates: SheetDateColumn[];
	rows: SheetRow[];
	rightCols: SheetRightColumn[];
	className?: string;
}
