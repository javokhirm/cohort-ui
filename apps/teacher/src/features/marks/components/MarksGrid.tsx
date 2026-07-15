import { useState } from 'react';

import {
	SheetTable,
	type SheetDropOption,
	type SheetRow,
} from '@/components/sheet-table';

import { LETTER_GRADES } from '../api/marks.queries';
import type { MarksGrid as GridData } from '../api/marks-grid.queries';
import { formatColumnDate, isTodayIso } from '../lib/month';
import { normalizedPctFor, parseScoreInput, scoreTone } from '../lib/scale';

interface MarkCellValue {
	rawScore?: number | null;
	letter?: string | null;
}

interface MarksGridProps {
	grid: GridData;
	onEditCell: (sessionId: number, studentId: number, value: MarkCellValue) => void;
}

const CELL_W_PX = 56;

/**
 * The monthly marks matrix, rendered with the shared `SheetTable` grid: a frozen
 * student column, one column per session date (today's is the only editable
 * one), and frozen AVG / RANK summary columns. The editable shape follows the
 * scale — a numeric input for POINTS/PERCENTAGE (committed on blur/Enter) or an
 * A–F popover for LETTER (parent-owned open state, per SheetTable's contract).
 * Past columns display read-only score/letter badges tinted by their band.
 */
export function MarksGrid({ grid, onEditCell }: MarksGridProps) {
	const [openCell, setOpenCell] = useState<string | null>(null);
	const [editing, setEditing] = useState<Record<string, string>>({});
	const isLetter = grid.config.type === 'LETTER';
	const max = grid.config.maxPoints ?? undefined;
	const step = grid.config.type === 'POINTS' && grid.config.allowHalf ? 0.5 : 1;

	const rows: SheetRow[] = grid.rows.map((row, i) => ({
		key: row.studentId,
		name: row.studentName ?? '—',
		striped: i % 2 === 1,
		right: [
			{
				tone: scoreTone(row.averagePct),
				disp: row.averagePct === null ? '—' : `${row.averagePct}%`,
				emphasis: true,
			},
			{
				tone: 'slate' as const,
				disp: row.rank === null ? '—' : `#${row.rank}`,
				pill: false,
			},
		],
		cells: grid.columns.map((col) => {
			const cellKey = `${row.studentId}:${col.sessionId}`;
			const cell = row.cells[col.sessionId];
			const today = isTodayIso(col.date);
			const editable = today && col.status !== 'CANCELLED';

			if (isLetter) {
				const dropOpts: SheetDropOption[] | undefined = editable
					? LETTER_GRADES.map((l) => ({
							label: l,
							tone: scoreTone(normalizedPctFor(grid.config, { letter: l })),
							selected: cell?.letter === l,
							onSelect: () => {
								onEditCell(col.sessionId, row.studentId, { letter: l });
								setOpenCell(null);
							},
						}))
					: undefined;
				return {
					kind: 'badge' as const,
					letter: cell?.letter ?? '',
					tone: cell ? scoreTone(cell.normalizedPct) : 'slate',
					opacity: cell ? 1 : 0.5,
					accent: today,
					onClick: editable
						? () => setOpenCell((cur) => (cur === cellKey ? null : cellKey))
						: undefined,
					isOpen: openCell === cellKey,
					dropOpts,
				};
			}

			// Numeric scale: today is an input cell; past columns are read-only badges.
			if (editable) {
				const savedStr = cell?.rawScore != null ? String(cell.rawScore) : '';
				return {
					kind: 'input' as const,
					value: editing[cellKey] ?? savedStr,
					accent: today,
					min: 0,
					max,
					step,
					inputMode: 'decimal' as const,
					onChange: (e) =>
						setEditing((prev) => ({ ...prev, [cellKey]: e.target.value })),
					onCommit: (value: string) => {
						setEditing((prev) => {
							const next = { ...prev };
							delete next[cellKey];
							return next;
						});
						if (value.trim() === savedStr) return; // unchanged
						const parsed = parseScoreInput(value);
						if (parsed === null) return; // empty/invalid: can't clear a mark here
						onEditCell(col.sessionId, row.studentId, { rawScore: parsed });
					},
				};
			}
			return {
				kind: 'badge' as const,
				letter: cell?.rawScore != null ? String(cell.rawScore) : '',
				tone: cell ? scoreTone(cell.normalizedPct) : 'slate',
				opacity: cell ? 1 : 0.5,
				accent: false,
			};
		}),
	}));

	return (
		<>
			{openCell && (
				<div className="fixed inset-0 z-40" onClick={() => setOpenCell(null)} />
			)}
			<SheetTable
				nameW="140px"
				headH="36px"
				rowH="44px"
				nameFont="13px"
				cellW={`${CELL_W_PX}px`}
				cellFont="13px"
				colW={`${CELL_W_PX * grid.columns.length}px`}
				dates={grid.columns.map((col) => ({
					label: formatColumnDate(col.date),
					accent: isTodayIso(col.date),
					opacity: col.status === 'CANCELLED' ? 0.5 : 1,
				}))}
				rows={rows}
				rightCols={[
					{ label: 'Avg', width: '58px' },
					{ label: 'Rank', width: '54px', divider: true },
				]}
			/>
		</>
	);
}
