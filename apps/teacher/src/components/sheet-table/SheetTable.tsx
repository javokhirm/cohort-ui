import { cn, TONE_CLASSES } from '@repo/ui';

import { BadgeCell } from './BadgeCell';
import { InputCell } from './InputCell';
import type { SheetTableProps } from './types';

const headerCellClass =
	'flex shrink-0 items-center border-b border-border text-[10.5px] font-bold tracking-[.03em] text-muted-foreground uppercase';

/**
 * A spreadsheet-style grid: a frozen left column of row labels, a
 * horizontally-scrolling middle region of dated columns, and one or more
 * frozen right-hand summary columns. Fully controlled and presentation-only —
 * it renders exactly what it's given and does no fetching, date math, or
 * business logic (marking statuses, computing rates/averages/ranks). The same
 * component serves both the attendance sheet (`kind: 'badge'` cells) and the
 * daily marks sheet (`kind: 'input'` cells); only the props differ. The
 * outer card fills its parent's box — size it from the caller (e.g. a
 * `h-[...]` or `flex-1 min-h-0` wrapper) so the vertical scroll has a bound.
 *
 * ## Usage — attendance sheet (badge cells + parent-owned popover state)
 * ```tsx
 * function AttendanceSheet({ grid, onMark }: Props) {
 *   const [openCell, setOpenCell] = useState<string | null>(null);
 *
 *   const rows: SheetRow[] = grid.rows.map((r, i) => ({
 *     key: r.studentId,
 *     name: r.studentName ?? '—',
 *     striped: i % 2 === 1,
 *     right: [{ tone: rateTone(r.rate), disp: r.rate == null ? '—' : `${r.rate}%`, emphasis: true }],
 *     cells: grid.columns.map((col) => {
 *       const cellKey = `${r.studentId}:${col.sessionId}`;
 *       const status = r.cells[col.sessionId]?.status;
 *       const editable = isTodayIso(col.date) && col.status !== 'CANCELLED';
 *       return {
 *         kind: 'badge',
 *         letter: status ? status[0] : '',
 *         tone: status ? resolveStatus('attendance', status).tone : 'slate',
 *         accent: isTodayIso(col.date),
 *         onClick: editable ? () => setOpenCell(cellKey) : undefined,
 *         isOpen: openCell === cellKey,
 *         dropOpts: STATUSES.map((s) => ({
 *           label: resolveStatus('attendance', s).label,
 *           tone: resolveStatus('attendance', s).tone,
 *           selected: status === s,
 *           onSelect: () => {
 *             onMark(col.sessionId, r.studentId, s);
 *             setOpenCell(null);
 *           },
 *         })),
 *       };
 *     }),
 *   }));
 *
 *   return (
 *     <div className="relative">
 *       {openCell && <div className="fixed inset-0 z-40" onClick={() => setOpenCell(null)} />}
 *       <SheetTable
 *         nameW="158px" headH="32px" rowH="30px" nameFont="12.5px"
 *         cellW="56px" cellFont="12.5px" colW={`${56 * grid.columns.length}px`}
 *         dates={grid.columns.map((c) => ({
 *           label: formatColumnDate(c.date),
 *           accent: isTodayIso(c.date),
 *         }))}
 *         rows={rows}
 *         rightCols={[{ label: 'Rate' }]}
 *       />
 *     </div>
 *   );
 * }
 * ```
 *
 * ## Usage — daily marks sheet (input cells)
 * ```tsx
 * function MarksSheet({ sessions, students, scores, onScoreChange }: Props) {
 *   const rows: SheetRow[] = students.map((s, i) => ({
 *     key: s.id,
 *     name: s.name,
 *     striped: i % 2 === 1,
 *     right: [
 *       { tone: avgTone(s.avg), disp: s.avg == null ? '—' : s.avg.toFixed(1), emphasis: true },
 *       { tone: 'slate', disp: s.rank == null ? '—' : `#${s.rank}`, pill: false },
 *     ],
 *     cells: sessions.map((sess) => ({
 *       kind: 'input',
 *       value: scores[s.id]?.[sess.id] ?? '',
 *       onChange: (e) => onScoreChange(s.id, sess.id, e.target.value),
 *     })),
 *   }));
 *
 *   return (
 *     <SheetTable
 *       nameW="158px" headH="32px" rowH="30px" nameFont="12.5px"
 *       cellW="56px" cellFont="13px" colW={`${56 * sessions.length}px`}
 *       dates={sessions.map((s) => ({ label: formatColumnDate(s.date) }))}
 *       rows={rows}
 *       rightCols={[{ label: 'Avg', width: '56px' }, { label: 'Rank', width: '52px', divider: true }]}
 *     />
 *   );
 * }
 * ```
 */
export function SheetTable({
	nameW,
	headH,
	rowH,
	nameFont,
	cellW,
	cellFont,
	colW,
	dates,
	rows,
	rightCols,
	className,
}: SheetTableProps) {
	return (
		<div
			className={cn(
				'overflow-hidden rounded-[13px] border border-border bg-card shadow-sm',
				className,
			)}
		>
			<div className="flex h-full overflow-y-auto">
				{/* Left: frozen row labels */}
				<div
					className="flex shrink-0 flex-col border-r border-border"
					style={{ width: nameW }}
				>
					<div
						className={cn(
							headerCellClass,
							'sticky top-0 z-10 bg-muted/50 px-3',
						)}
						style={{ height: headH }}
					>
						Student
					</div>
					{rows.map((row) => (
						<div
							key={row.key}
							className={cn(
								'flex shrink-0 items-center border-b border-border px-3',
								row.striped && 'bg-muted/40',
							)}
							style={{ height: rowH }}
						>
							<span
								className="min-w-0 flex-1 truncate font-semibold text-foreground"
								style={{ fontSize: nameFont }}
							>
								{row.name}
							</span>
						</div>
					))}
				</div>

				{/* Middle: horizontally-scrolling dated columns */}
				<div className="min-w-0 flex-1 overflow-x-auto">
					<div className="flex flex-col" style={{ minWidth: colW }}>
						<div
							className="sticky top-0 z-10 flex shrink-0 border-b border-border bg-muted/50"
							style={{ height: headH }}
						>
							{dates.map((d, i) => (
								<div
									key={i}
									className={cn(
										headerCellClass,
										'justify-center border-r border-b-0 border-border/60 tabular-nums',
										d.accent && 'border-l-2 border-l-primary',
									)}
									style={{ width: cellW, opacity: d.opacity ?? 1 }}
								>
									{d.label}
								</div>
							))}
						</div>
						{rows.map((row) => (
							<div
								key={row.key}
								className={cn(
									'flex shrink-0 border-b border-border',
									row.striped && 'bg-muted/40',
								)}
								style={{ height: rowH }}
							>
								{row.cells.map((cell, i) =>
									cell.kind === 'badge' ? (
										<BadgeCell
											key={i}
											cell={cell}
											width={cellW}
											fontSize={cellFont}
										/>
									) : (
										<InputCell
											key={i}
											cell={cell}
											width={cellW}
											fontSize={cellFont}
										/>
									),
								)}
							</div>
						))}
					</div>
				</div>

				{/* Right: frozen summary column(s), visually separated */}
				<div className="flex shrink-0 flex-col border-l-2 border-border">
					<div
						className="sticky top-0 z-10 flex shrink-0 border-b border-border bg-primary/10"
						style={{ height: headH }}
					>
						{rightCols.map((rc, i) => (
							<div
								key={i}
								className={cn(
									headerCellClass,
									'justify-center border-b-0 text-primary',
									rc.width ? 'shrink-0' : 'flex-1',
									rc.divider && 'border-l border-border/60',
								)}
								style={rc.width ? { width: rc.width } : undefined}
							>
								{rc.label}
							</div>
						))}
					</div>
					{rows.map((row) => (
						<div
							key={row.key}
							className={cn(
								'flex shrink-0 border-b border-border',
								row.striped && 'bg-muted/40',
							)}
							style={{ height: rowH }}
						>
							{row.right.map((rv, i) => {
								const rc = rightCols[i];
								return (
									<div
										key={i}
										className={cn(
											'flex items-center justify-center font-bold tabular-nums',
											rc?.width ? 'shrink-0' : 'flex-1',
											rc?.divider && 'border-l border-border/60',
											rv.pill === false
												? 'text-foreground'
												: TONE_CLASSES[rv.tone],
											rv.emphasis
												? 'text-[13.5px] font-extrabold'
												: 'text-[12.5px] font-bold',
										)}
										style={
											rc?.width ? { width: rc.width } : undefined
										}
									>
										{rv.disp}
									</div>
								);
							})}
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
