import type * as React from 'react';

import type { StatusTone } from '@repo/ui';

/** One header in the scrolling middle region (a date or session). */
export interface SheetDateColumn {
	label: string;
	/** 0–1 opacity, e.g. to dim a not-yet-happened date. Defaults to 1. */
	opacity?: number;
	/** Marks this column's left edge with a 2px primary accent (e.g. "today"). */
	accent?: boolean;
}

/** One option in a badge cell's status-picker popover. */
export interface SheetDropOption {
	label: string;
	tone: StatusTone;
	selected?: boolean;
	onSelect: () => void;
}

/** A colored, centered letter — the attendance-sheet cell kind. */
export interface SheetBadgeCell {
	kind: 'badge';
	letter: string;
	tone: StatusTone;
	/** 0–1 opacity, e.g. to dim an unmarked cell. Defaults to 1. */
	opacity?: number;
	accent?: boolean;
	/** Present only when this cell is editable; clicking it opens `dropOpts`. */
	onClick?: () => void;
	/** Popover open state — owned by the parent, not this component. */
	isOpen?: boolean;
	dropOpts?: SheetDropOption[];
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
	/** Fixed width; omit to fill the remaining right-side width (single-column case). */
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
	/** Left (row-label) column width, e.g. "158px". */
	nameW: string;
	/** Header row height, e.g. "32px". */
	headH: string;
	/** Body row height, e.g. "30px". */
	rowH: string;
	nameFont: string;
	/** Width of each date/session column. */
	cellW: string;
	cellFont: string;
	/** `cellW * dates.length` — the scrolling middle region's min-width. */
	colW: string;
	dates: SheetDateColumn[];
	rows: SheetRow[];
	rightCols: SheetRightColumn[];
	className?: string;
}
