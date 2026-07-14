import { Card, ProgressBar, StatusBadge } from '@repo/ui';

import type { StudentImportSessionView } from '@/api/student-imports/types';

import { IMPORT_STATUS_LABEL, IMPORT_STATUS_TONE } from '../constants';

function Stat({
	label,
	value,
	tone,
}: {
	label: string;
	value: number;
	tone?: 'default' | 'danger' | 'warn' | 'muted';
}) {
	const toneClass =
		tone === 'danger'
			? 'text-destructive'
			: tone === 'warn'
				? 'text-tone-amber-fg'
				: tone === 'muted'
					? 'text-muted-foreground'
					: 'text-foreground';

	return (
		<Card className="gap-1 p-4">
			<span className="text-xs font-medium text-muted-foreground">{label}</span>
			<span className={`text-2xl font-semibold tabular-nums ${toneClass}`}>
				{value}
			</span>
		</Card>
	);
}

/**
 * The session at a glance. Before the import runs, this is the validation verdict
 * (how many rows will import, how many are blocked). While it runs, it is a
 * progress bar. Afterwards, it is what actually happened.
 */
export function ImportSummary({ session }: { session: StudentImportSessionView }) {
	const { counters, status } = session;
	const isApplying = status === 'QUEUED' || status === 'APPLYING';
	const isDone = status === 'COMPLETED';

	const percent =
		counters.validRows > 0
			? Math.round((counters.processedRows / counters.validRows) * 100)
			: 0;

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-wrap items-center gap-3">
				<StatusBadge tone={IMPORT_STATUS_TONE[status]}>
					{IMPORT_STATUS_LABEL[status]}
				</StatusBadge>
				<span className="font-mono text-sm text-muted-foreground">
					{session.fileName}
				</span>
			</div>

			{session.errorMessage && (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					{session.errorMessage}
				</div>
			)}

			{isApplying && (
				<Card className="gap-3 p-4">
					<div className="flex items-center justify-between text-sm">
						<span className="font-medium">Importing students…</span>
						<span className="tabular-nums text-muted-foreground">
							{counters.processedRows} / {counters.validRows}
						</span>
					</div>
					<ProgressBar value={percent} tone="amber" />
					<p className="text-xs text-muted-foreground">
						This runs in the background — you can leave this page and come
						back.
					</p>
				</Card>
			)}

			{isDone ? (
				<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
					<Stat
						label="Students imported"
						value={counters.createdStudentCount}
					/>
					<Stat label="Enrollments created" value={counters.createdCount} />
					<Stat
						label="Already enrolled"
						value={counters.skippedCount}
						tone="muted"
					/>
					<Stat label="Failed" value={counters.failedCount} tone="danger" />
				</div>
			) : (
				<div className="grid grid-cols-2 gap-3 md:grid-cols-4">
					<Stat label="Rows in file" value={counters.totalRows} />
					<Stat label="Will import" value={counters.validRows} />
					<Stat
						label="Blocked by errors"
						value={counters.invalidRows}
						tone={counters.invalidRows > 0 ? 'danger' : 'muted'}
					/>
					<Stat
						label="With warnings"
						value={counters.warningRows}
						tone={counters.warningRows > 0 ? 'warn' : 'muted'}
					/>
				</div>
			)}
		</div>
	);
}
