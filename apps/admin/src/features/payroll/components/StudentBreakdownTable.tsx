import { Card, DataTable, type ColumnDef } from '@repo/ui';
import { formatPrice } from '@repo/utils';

import type { RateType } from '../api/keys';
import type { PayrollBreakdownLine } from '../api/payroll.queries';

interface StudentBreakdownTableProps {
	lines: PayrollBreakdownLine[];
	rateType: RateType;
	sessionsTaught: number;
	hoursTaught: number;
}

function prorationLabel(factor: number): string {
	return `${Math.round(factor * 1000) / 10}%`;
}

/**
 * Per-student audit lines. For revenue-share (PERCENT) teachers the lines sum
 * into the gross; for everyone else they are listed for audit only — the
 * footnote under the table says which reading applies.
 */
export function StudentBreakdownTable({
	lines,
	rateType,
	sessionsTaught,
	hoursTaught,
}: StudentBreakdownTableProps) {
	const isPercent = rateType === 'PERCENT';

	const columns: ColumnDef<PayrollBreakdownLine>[] = [
		{
			id: 'student',
			header: 'Student',
			cell: ({ row }) => (
				<div className="min-w-0">
					<div className="truncate text-sm font-medium">
						{row.original.studentName}
					</div>
					<div className="truncate text-xs text-muted-foreground">
						{row.original.groupName}
					</div>
				</div>
			),
		},
		{
			accessorKey: 'monthlyTuition',
			header: () => <div className="text-right">Monthly tuition</div>,
			cell: ({ getValue }) => (
				<div className="text-right text-sm tabular-nums text-muted-foreground">
					{formatPrice(getValue<number>())}
				</div>
			),
			size: 120,
		},
		{
			id: 'sessions',
			header: () => <div className="text-right">Sessions</div>,
			cell: ({ row }) => (
				<div className="text-right text-sm tabular-nums text-muted-foreground">
					{row.original.sessionsTaught}/{row.original.sessionsTotalPlanned}
				</div>
			),
			size: 92,
		},
		{
			accessorKey: 'prorationFactor',
			header: () => <div className="text-right">Proration</div>,
			cell: ({ getValue }) => (
				<div className="text-right text-sm tabular-nums text-muted-foreground">
					{prorationLabel(getValue<number>())}
				</div>
			),
			size: 88,
		},
		{
			accessorKey: 'hours',
			header: () => <div className="text-right">Hours</div>,
			cell: ({ getValue }) => (
				<div className="text-right text-sm tabular-nums text-muted-foreground">
					{getValue<number>()}
				</div>
			),
			size: 72,
		},
		{
			accessorKey: 'revenueBase',
			header: () => <div className="text-right">Revenue line</div>,
			cell: ({ getValue }) => (
				<div className="text-right text-sm font-medium tabular-nums">
					{formatPrice(getValue<number>())}
				</div>
			),
			size: 120,
		},
	];

	if (isPercent) {
		columns.push({
			accessorKey: 'share',
			header: () => <div className="text-right">Share</div>,
			cell: ({ getValue }) => (
				<div className="text-right text-sm font-semibold tabular-nums">
					{formatPrice(getValue<number>())}
				</div>
			),
			size: 120,
		});
	}

	return (
		<Card className="gap-0 overflow-hidden py-0">
			<div className="flex items-center justify-between border-b border-border px-5 py-3.5">
				<h2 className="text-sm font-bold">Student breakdown</h2>
				<span className="text-xs text-muted-foreground">
					{lines.length} students · {sessionsTaught} sessions · {hoursTaught}h
				</span>
			</div>
			<DataTable
				columns={columns}
				data={lines}
				getRowId={(row) => String(row.enrollmentId)}
				emptyState={
					<div className="py-12 text-center text-sm text-muted-foreground">
						No student lines for this period.
					</div>
				}
				className="rounded-none border-0"
			/>
			<div className="border-t border-border bg-muted/40 px-5 py-3 text-xs text-muted-foreground">
				{isPercent ? (
					<>
						Denominator is <b>every class the group holds this month</b>{' '}
						across all teachers — taught, still scheduled or cancelled. So
						tuition is earned per class actually delivered: shared students
						are split and never double-paid, a student who joined or left
						mid-month funds only the classes they were enrolled for, an open
						month accrues rather than paying the full fee up front, and a
						cancelled class is earned by nobody.
					</>
				) : (
					<>
						Per-student revenue lines apply to revenue-share teachers only.
						This teacher is paid on the basis shown above; students are listed
						for audit.
					</>
				)}
			</div>
		</Card>
	);
}
