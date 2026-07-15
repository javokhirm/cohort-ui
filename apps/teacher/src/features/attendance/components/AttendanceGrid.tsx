import { useState } from 'react';

import { resolveStatus, type StatusTone } from '@repo/ui';

import {
	SheetTable,
	type SheetDropOption,
	type SheetRow,
} from '@/components/sheet-table';

import { ATTENDANCE_STATUSES, type AttendanceStatus } from '../api/attendance.queries';
import type { AttendanceGrid as GridData } from '../api/attendance-grid.queries';
import { formatColumnDate, isTodayIso } from '../lib/month';

interface AttendanceGridProps {
	grid: GridData;
	onEditCell: (sessionId: number, studentId: number, status: AttendanceStatus) => void;
}

const CELL_W_PX = 52;

function rateTone(rate: number): StatusTone {
	if (rate >= 90) return 'green';
	if (rate >= 75) return 'amber';
	return 'red';
}

/**
 * The monthly attendance matrix, rendered with the shared `SheetTable` grid: a
 * frozen student column, one column per session date (today's is bracketed in
 * the primary colour and is the only editable one, via a status popover), and
 * a frozen RATE column banded green/amber/red. Popover state is lifted here
 * (one cell open at a time) with a full-screen click-catcher to close it on an
 * outside click, per SheetTable's controlled-popover contract.
 */
export function AttendanceGrid({ grid, onEditCell }: AttendanceGridProps) {
	const [openCell, setOpenCell] = useState<string | null>(null);

	const rows: SheetRow[] = grid.rows.map((row, i) => ({
		key: row.studentId,
		name: row.studentName ?? '—',
		striped: i % 2 === 1,
		right: [
			{
				tone: row.rate === null ? 'slate' : rateTone(row.rate),
				disp: row.rate === null ? '—' : `${row.rate}%`,
				emphasis: true,
			},
		],
		cells: grid.columns.map((col) => {
			const cellKey = `${row.studentId}:${col.sessionId}`;
			const status = row.cells[col.sessionId]?.status;
			const today = isTodayIso(col.date);
			const editable = today && col.status !== 'CANCELLED';
			const descriptor = status ? resolveStatus('attendance', status) : null;

			const dropOpts: SheetDropOption[] = ATTENDANCE_STATUSES.map((s) => {
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
			});

			return {
				kind: 'badge' as const,
				letter: descriptor?.label[0] ?? '',
				tone: descriptor?.tone ?? 'slate',
				opacity: descriptor ? 1 : 0.5,
				accent: today,
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
				rightCols={[{ label: 'Rate' }]}
			/>
		</>
	);
}
