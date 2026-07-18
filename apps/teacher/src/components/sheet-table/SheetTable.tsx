import { cn, TONE_CLASSES } from '@repo/ui';

import { BadgeCell } from './BadgeCell';
import { InputCell } from './InputCell';
import type { SheetTableProps } from './types';

/** Fallback width for a right-hand summary column that declares none. */
const DEFAULT_RIGHT_W = '64px';

const headCell =
	'flex shrink-0 items-center text-[10px] font-bold tracking-[.04em] text-muted-foreground uppercase';

/**
 * A spreadsheet-style grid with both axes frozen: the header row stays put while
 * you scroll down, and the student column plus the right-hand summary columns
 * stay put while you scroll sideways. Everything lives in **one** scroll
 * container and freezing is done with `position: sticky`, which is what makes
 * the two axes hold together — a nested scroller per region cannot.
 *
 * Fully controlled and presentation-only: it renders exactly what it's given and
 * does no fetching, date math, or business logic (marking statuses, computing
 * rates/averages/ranks). The same component serves the attendance sheet
 * (`kind: 'badge'` cells) and the marks sheet (`kind: 'input'` cells); only the
 * props differ.
 *
 * **Sizing.** The outer card fills its parent's box, so the caller must bound it
 * — `min-h-0 flex-1` inside a flex column, or an explicit `h-[...]`. Without a
 * bound the card grows to its content and nothing has room to stick.
 *
 * **Opaque surfaces.** Frozen cells paint over the cells scrolling beneath them,
 * so every sticky surface uses a solid token (`bg-card` / `bg-muted`), never a
 * translucent one. Tints layered *inside* a frozen cell (today's column, a tone
 * pill) may be translucent — the opaque parent is behind them.
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
 *         label: `${r.studentName}, ${formatFullDate(col.date)}`,
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
 *     <>
 *       {openCell && <div className="fixed inset-0 z-40" onClick={() => setOpenCell(null)} />}
 *       <SheetTable
 *         className="min-h-0 flex-1"
 *         nameW="168px" headH="40px" rowH="44px" nameFont="13px"
 *         cellW="52px" cellFont="13px"
 *         dates={grid.columns.map((c) => ({
 *           label: formatDayOfMonth(c.date),
 *           sublabel: formatWeekday(c.date),
 *           accent: isTodayIso(c.date),
 *         }))}
 *         rows={rows}
 *         rightCols={[{ label: 'Rate', width: '62px' }]}
 *       />
 *     </>
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
	dates,
	rows,
	rightCols,
	className,
}: SheetTableProps) {
	return (
		<div
			className={cn(
				'overflow-hidden rounded-2xl border border-border bg-card shadow-sm',
				className,
			)}
		>
			<div className="h-full overflow-auto overscroll-contain">
				<div className="min-w-max">
					{/* Header — frozen against vertical scroll. The opaque surface
					    lives on the row, so a cell tint (today) can be translucent
					    without the body showing through as it scrolls under. */}
					<div
						className="sticky top-0 z-30 flex border-b border-border bg-muted"
						style={{ height: headH }}
					>
						<div
							className={cn(
								headCell,
								'sticky left-0 z-10 border-r border-border bg-muted px-3',
							)}
							style={{ width: nameW }}
						>
							Student
						</div>
						{dates.map((d, i) => (
							<div
								key={i}
								className={cn(
									headCell,
									'flex-col justify-center gap-0.5 border-r border-border/60 tabular-nums',
									d.accent && 'bg-primary/15 text-primary',
									d.muted && 'opacity-45',
								)}
								style={{ flex: `1 0 ${cellW}` }}
								title={d.title}
							>
								{d.sublabel && (
									<span className="text-[8.5px] leading-none font-semibold opacity-70">
										{d.sublabel}
									</span>
								)}
								<span className="text-[11.5px] leading-none">
									{d.label}
								</span>
							</div>
						))}
						<div className="sticky right-0 z-10 flex bg-muted">
							{rightCols.map((rc, i) => (
								<div
									key={i}
									className={cn(
										headCell,
										'justify-center border-l border-border/60 bg-primary/10 text-primary',
										rc.divider && 'border-l-border',
									)}
									style={{ width: rc.width ?? DEFAULT_RIGHT_W }}
								>
									{rc.label}
								</div>
							))}
						</div>
					</div>

					{/* Body — the name column and summary block are frozen against
					    horizontal scroll, so both keep the row's own surface. */}
					{rows.map((row) => {
						const surface = row.striped ? 'bg-muted' : 'bg-card';
						return (
							<div
								key={row.key}
								className={cn(
									'group/row flex border-b border-border transition-colors last:border-b-0',
									surface,
									'hover:bg-accent',
								)}
								style={{ height: rowH }}
							>
								<div
									className={cn(
										'sticky left-0 z-10 flex shrink-0 items-center border-r border-border px-3 transition-colors',
										surface,
										'group-hover/row:bg-accent',
									)}
									style={{ width: nameW }}
								>
									<span
										className="min-w-0 flex-1 truncate font-semibold text-foreground"
										style={{ fontSize: nameFont }}
										title={row.name}
									>
										{row.name}
									</span>
								</div>

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

								<div
									className={cn(
										'sticky right-0 z-10 flex shrink-0 transition-colors',
										surface,
										'group-hover/row:bg-accent',
									)}
								>
									{row.right.map((rv, i) => {
										const rc = rightCols[i];
										return (
											<div
												key={i}
												className={cn(
													'flex shrink-0 items-center justify-center border-l border-border/60',
													rc?.divider && 'border-l-border',
												)}
												style={{
													width: rc?.width ?? DEFAULT_RIGHT_W,
												}}
											>
												<span
													className={cn(
														'inline-flex items-center justify-center tabular-nums',
														rv.pill === false
															? 'font-bold text-foreground'
															: cn(
																	'rounded-md px-1.5 py-0.5 font-bold',
																	TONE_CLASSES[rv.tone],
																),
													)}
													style={{
														fontSize: rv.emphasis
															? '12.5px'
															: '12px',
													}}
												>
													{rv.disp}
												</span>
											</div>
										);
									})}
								</div>
							</div>
						);
					})}
				</div>
			</div>
		</div>
	);
}
