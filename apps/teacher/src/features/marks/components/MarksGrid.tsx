import { useState } from 'react';

import { formatDayOfMonth, formatFullDate, formatWeekday } from '@repo/utils';

import {
	SheetTable,
	type SheetDropOption,
	type SheetRow,
} from '@/components/sheet-table';

import { LETTER_GRADES } from '../api/marks.queries';
import type { MarksGrid as GridData } from '../api/marks-grid.queries';
import { isPastOrTodayIso, isTodayIso } from '../lib/month';
import { normalizedPctFor, parseScoreInput, scoreTone } from '../lib/scale';
import { useAppT } from '@/locales';

interface MarkCellValue {
	rawScore?: number | null;
	letter?: string | null;
}

interface MarksGridProps {
	grid: GridData;
	onEditCell: (sessionId: number, studentId: number, value: MarkCellValue) => void;
	onClearCell: (sessionId: number, studentId: number) => void;
}

const CELL_W_PX = 56;

/**
 * The monthly marks matrix, rendered with the shared `SheetTable` grid: a frozen
 * student column, one column per session date (any past-or-today, non-cancelled
 * session is editable — today's is tinted but that's a visual cue only), and
 * frozen AVG / RANK summary columns. The editable shape follows the scale — a
 * numeric input for POINTS/PERCENTAGE (committed on blur/Enter; blanking it
 * clears the mark) or an A–F popover for LETTER (parent-owned open state, plus
 * a "Clear" entry once a letter is set, per SheetTable's contract). Future
 * columns display read-only score/letter chips tinted by their band.
 *
 * Sized to fill its parent, so render it inside a bounded flex column — the
 * frozen header and student column need the grid to own its own scroll.
 */
export function MarksGrid({ grid, onEditCell, onClearCell }: MarksGridProps) {
	const t = useAppT('marks');
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
			const editable = isPastOrTodayIso(col.date) && col.status !== 'CANCELLED';
			const name = row.studentName ?? t('column.student');
			const date = formatFullDate(col.date);

			if (isLetter) {
				const dropOpts: SheetDropOption[] | undefined = editable
					? [
							...LETTER_GRADES.map((l) => ({
								label: l,
								tone: scoreTone(
									normalizedPctFor(grid.config, { letter: l }),
								),
								selected: cell?.letter === l,
								onSelect: () => {
									onEditCell(col.sessionId, row.studentId, {
										letter: l,
									});
									setOpenCell(null);
								},
							})),
							...(cell?.letter
								? [
										{
											label: t('clearMark'),
											tone: 'red' as const,
											destructive: true,
											onSelect: () => {
												onClearCell(col.sessionId, row.studentId);
												setOpenCell(null);
											},
										},
									]
								: []),
						]
					: undefined;
				return {
					kind: 'badge' as const,
					letter: cell?.letter ?? '',
					tone: cell ? scoreTone(cell.normalizedPct) : 'slate',
					accent: today,
					label: t('cellLabel', {
						name,
						date,
						status: cell?.letter ?? t('notMarked'),
					}),
					onClick: editable
						? () => setOpenCell((cur) => (cur === cellKey ? null : cellKey))
						: undefined,
					isOpen: openCell === cellKey,
					dropOpts,
				};
			}

			// Numeric scale: any past-or-today, non-cancelled column is an input
			// cell; future columns are read-only chips.
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
					label: t('cellLabel', { name, date, status: t('score') }),
					onChange: (e) =>
						setEditing((prev) => ({ ...prev, [cellKey]: e.target.value })),
					onCommit: (value: string) => {
						setEditing((prev) => {
							const next = { ...prev };
							delete next[cellKey];
							return next;
						});
						if (value.trim() === savedStr) return; // unchanged
						if (value.trim() === '') {
							// Blanking a saved score clears the mark entirely.
							if (savedStr !== '')
								onClearCell(col.sessionId, row.studentId);
							return;
						}
						const parsed = parseScoreInput(value);
						if (parsed === null) return; // invalid: ignore, reverts to savedStr
						onEditCell(col.sessionId, row.studentId, { rawScore: parsed });
					},
				};
			}
			return {
				kind: 'badge' as const,
				letter: cell?.rawScore != null ? String(cell.rawScore) : '',
				tone: cell ? scoreTone(cell.normalizedPct) : 'slate',
				accent: false,
				label: t('cellLabel', {
					name,
					date,
					status: cell?.rawScore ?? t('notMarked'),
				}),
			};
		}),
	}));

	return (
		<>
			{openCell && (
				<div className="fixed inset-0 z-40" onClick={() => setOpenCell(null)} />
			)}
			<SheetTable
				className="min-h-0 flex-1"
				nameW="168px"
				headH="42px"
				rowH="44px"
				nameFont="13px"
				cellW={`${CELL_W_PX}px`}
				cellFont="12.5px"
				dates={grid.columns.map((col) => ({
					label: formatDayOfMonth(col.date),
					sublabel: formatWeekday(col.date),
					accent: isTodayIso(col.date),
					muted: col.status === 'CANCELLED',
					title:
						col.status === 'CANCELLED'
							? t('dateCancelled', { date: formatFullDate(col.date) })
							: formatFullDate(col.date),
				}))}
				rows={rows}
				rightCols={[
					{ label: t('column.avg'), width: '62px' },
					{ label: t('column.rank'), width: '54px', divider: true },
				]}
			/>
		</>
	);
}
