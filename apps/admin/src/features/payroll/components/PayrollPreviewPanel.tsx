import { AlertTriangle, Ban } from 'lucide-react';

import {
	Alert,
	AlertDescription,
	AlertTitle,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@repo/ui';
import { formatDate, formatPrice } from '@repo/utils';

import type { PayrollPreviewResponse } from '../api/payroll.queries';

/**
 * Dry-run panel under the create-payroll form: what `POST /payrolls` would
 * produce for the chosen staff + period. Shows the already-paid day ranges that
 * will be excluded (the backend never pays the same day twice), the per-student
 * lines for PERCENT-paid teachers, and the computed gross. Purely informational
 * — the server recomputes everything on create.
 */
export function PayrollPreviewPanel({ preview }: { preview: PayrollPreviewResponse }) {
	const breakdown = preview.breakdown;
	const isPercent = breakdown?.type === 'PERCENT';

	return (
		<div className="flex flex-col gap-3">
			{preview.skippedRanges.map((range) => (
				<Alert key={`${range.start}-${range.end}`}>
					<AlertTriangle className="size-4" />
					<AlertTitle>Already-paid days excluded</AlertTitle>
					<AlertDescription>
						{formatDate(range.start)} – {formatDate(range.end)} is already
						covered by payroll record #{range.payrollId} and will not be paid
						again.
					</AlertDescription>
				</Alert>
			))}

			{preview.fullyCovered ? (
				<Alert variant="destructive">
					<Ban className="size-4" />
					<AlertTitle>Nothing to pay for this period</AlertTitle>
					<AlertDescription>
						Every day of the selected period is already covered by existing
						payroll records for this staff member.
					</AlertDescription>
				</Alert>
			) : (
				<>
					{isPercent && breakdown.lines.length > 0 && (
						<div className="rounded-lg border">
							<Table>
								<TableHeader>
									<TableRow>
										<TableHead>Student</TableHead>
										<TableHead>Group</TableHead>
										<TableHead className="text-right">
											Lessons
										</TableHead>
										<TableHead className="text-right">
											Share
										</TableHead>
									</TableRow>
								</TableHeader>
								<TableBody>
									{breakdown.lines.map((line) => (
										<TableRow key={line.enrollmentId}>
											<TableCell>{line.studentName}</TableCell>
											<TableCell className="text-muted-foreground">
												{line.groupName}
											</TableCell>
											<TableCell className="text-right tabular-nums">
												{line.sessionsCounted} /{' '}
												{line.sessionsTotal}
											</TableCell>
											<TableCell className="text-right tabular-nums">
												{formatPrice(line.amount)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</div>
					)}
					{isPercent && breakdown.lines.length === 0 && (
						<p className="text-sm text-muted-foreground">
							No enrolled students found in this teacher&apos;s groups for
							the period — the computed share is zero.
						</p>
					)}
					<div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-3">
						<span className="text-sm font-medium">
							Computed gross
							{isPercent && ` (${breakdown.percent}% share)`}
						</span>
						<span className="text-sm font-semibold tabular-nums">
							{formatPrice(preview.grossAmount)}
						</span>
					</div>
				</>
			)}
		</div>
	);
}
