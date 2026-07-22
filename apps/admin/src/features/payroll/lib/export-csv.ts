import type { PayrollPeriodRow } from '../api/payroll.queries';

/** Quote a CSV cell when it contains a delimiter/quote/newline. */
function csvCell(value: string | number): string {
	const s = String(value);
	return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * Client-side CSV of the rows currently on screen (raw numbers, not
 * locale-formatted, so the file opens cleanly in spreadsheets).
 */
export function buildPayrollCsv(rows: PayrollPeriodRow[]): string {
	const header = [
		'Teacher',
		'Code',
		'Type',
		'Sessions',
		'Students',
		'Computed',
		'Advances',
		'Net payable',
		'Status',
	];
	const lines = rows.map((row) =>
		[
			row.staffName,
			row.staffCode,
			row.rateType,
			row.sessionsTaught,
			row.studentsCount,
			row.grossAmount,
			row.advancesTotal,
			row.netAmount,
			row.status,
		]
			.map(csvCell)
			.join(','),
	);
	return [header.join(','), ...lines].join('\n');
}

/** Trigger a browser download of `content` as `filename`. */
export function downloadCsv(filename: string, content: string): void {
	const blob = new Blob([content], { type: 'text/csv;charset=utf-8' });
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = filename;
	anchor.click();
	URL.revokeObjectURL(url);
}
