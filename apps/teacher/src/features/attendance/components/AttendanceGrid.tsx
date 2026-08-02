import { useState } from 'react';

import { resolveStatus } from '@repo/ui';
import { formatDayOfMonth, formatFullDate, formatWeekday } from '@repo/utils';

import {
	SheetTable,
	type SheetDropOption,
	type SheetRow,
} from '@/components/sheet-table';

import { ATTENDANCE_STATUSES, type AttendanceStatus } from '../api/attendance.queries';
import type { AttendanceGrid as GridData } from '../api/attendance-grid.queries';
import { isPastOrTodayIso, isTodayIso } from '../lib/month';
import { rateTone } from '../lib/rate';
import { useAppT } from '@/locales';

interface AttendanceGridProps {
	grid: GridData;
	onEditCell: (sessionId: number, studentId: number, status: AttendanceStatus) => void;
}

const CELL_W_PX = 52;

/**
 * The monthly attendance matrix, rendered with the shared `SheetTable` grid: a
 * frozen student column, one column per session date (any past-or-today,
 * non-cancelled session is editable via a status popover — today's is tinted
 * but that's a visual cue only, not an editability gate), and a frozen RATE
 * column banded green/amber/red. Popover state is lifted here (one cell open
 * at a time) with a full-screen click-catcher to close it on an outside
 * click, per SheetTable's controlled-popover contract.
 *
 * Sized to fill its parent, so render it inside a bounded flex column — the
 * frozen header and student column need the grid to own its own scroll.
 */
export function AttendanceGrid({ grid, onEditCell }: AttendanceGridProps) {
	const t = useAppT('attendance');
	const tm = useAppT('marks');
	const [openCell, setOpenCell] = useState<string | null>(null);

	const rows: SheetRow[] = grid.rows.map((row, i) => ({
		key: row.studentId,
		name: row.studentName ?? '—',
		striped: i % 2 === 1,
		right: [
			{
				tone: rateTone(row.rate),
				disp: row.rate === null ? '—' : `${row.rate}%`,
				emphasis: true,
			},
		],
		cells: grid.columns.map((col) => {
			const cellKey = `${row.studentId}:${col.sessionId}`;
			const status = row.cells[col.sessionId]?.status;
			const today = isTodayIso(col.date);
			const editable = isPastOrTodayIso(col.date) && col.status !== 'CANCELLED';
			const descriptor = status ? resolveStatus('attendance', status) : null;

			const dropOpts: SheetDropOption[] | undefined = editable
				? ATTENDANCE_STATUSES.map((s) => {
						const { tone, label } = resolveStatus('attendance', s);
						return {
							label,
							tone,
							selected: status === s,
							onSelect: () => {
								onEditCell(col.sessionId, row.studentId, s);
								setOpenCell(null);
							},
						};
					})
				: undefined;

			return {
				kind: 'badge' as const,
				letter: descriptor?.label[0] ?? '',
				tone: descriptor?.tone ?? 'slate',
				accent: today,
				label: t('cellLabel', {
					name: row.studentName ?? t('studentFallback'),
					date: formatFullDate(col.date),
					status: descriptor?.label ?? t('notMarked'),
				}),
				onClick: editable
					? () => setOpenCell((cur) => (cur === cellKey ? null : cellKey))
					: undefined,
				isOpen: openCell === cellKey,
				dropOpts,
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
				rightCols={[{ label: tm('column.rate'), width: '64px' }]}
			/>
		</>
	);
}
