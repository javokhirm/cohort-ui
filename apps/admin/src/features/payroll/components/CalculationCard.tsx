import { ChevronRight } from 'lucide-react';

import { Card } from '@repo/ui';
import { formatDate, formatMoney, formatPrice } from '@repo/utils';

import type { PayrollStaffPeriodResponse } from '../api/payroll.queries';

/**
 * Full-precision figure (the pre-rounding gross / exact revenue base). Not a
 * currency display — a math artifact shown for auditability, so it keeps up to
 * six decimals via Intl rather than the 2-dp money formatters.
 */
const EXACT_FORMATTER = new Intl.NumberFormat('ru-RU', {
	minimumFractionDigits: 2,
	maximumFractionDigits: 6,
});

function rateDescription(period: PayrollStaffPeriodResponse): string {
	const { calculation } = period.breakdown;
	switch (period.rateType) {
		case 'PERCENT':
			return `${calculation.percent ?? 0}% of student fees`;
		case 'HOURLY':
			return 'Hourly rate';
		case 'FIXED':
			return 'Fixed monthly salary';
	}
}

/** The client-composed monospace formula line, from the server's inputs. */
function formulaLine(period: PayrollStaffPeriodResponse): string {
	const { calculation } = period.breakdown;
	switch (period.rateType) {
		case 'PERCENT':
			return `${calculation.percent ?? 0}% × ${formatPrice(
				calculation.revenueBaseTotalExact ?? 0,
			)} UZS revenue base`;
		case 'HOURLY':
			return `${calculation.hoursTaught}h × ${formatPrice(
				calculation.hourlyRate ?? 0,
			)} UZS/h`;
		case 'FIXED': {
			const base = formatPrice(calculation.baseSalary ?? 0);
			// A factor is sent only when the configs cover part of the month;
			// null means the salary was earned in full.
			const factor = calculation.prorationFactor;
			if (factor !== null && factor < 1) {
				const pct = Math.round(factor * 1000) / 10;
				return `${base} UZS monthly × ${pct}% of month`;
			}
			return `${base} UZS monthly salary`;
		}
	}
}

/**
 * "How this is calculated" — the audit card. Everything shown here is
 * server-computed; the card only lays the inputs out (formula → full-precision
 * figure → rounded gross) and, once finalized, names the frozen snapshot.
 */
export function CalculationCard({ period }: { period: PayrollStaffPeriodResponse }) {
	const { calculation } = period.breakdown;

	return (
		<Card className="gap-0 p-5">
			<div className="mb-3 flex flex-wrap items-center gap-2.5">
				<h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
					How this is calculated
				</h2>
				<span className="text-xs text-muted-foreground">
					{rateDescription(period)} · {calculation.sessionsTaught} sessions ·{' '}
					{calculation.studentsCount} students
				</span>
			</div>

			<div className="rounded-lg bg-muted/60 px-3.5 py-3 font-mono text-sm text-foreground/80">
				{formulaLine(period)}
			</div>

			<div className="mt-3.5 flex flex-wrap items-center gap-x-5 gap-y-3">
				{period.rateType === 'PERCENT' &&
					calculation.revenueBaseTotalExact !== null && (
						<div>
							<div className="text-xs text-muted-foreground">
								Revenue base (prorated)
							</div>
							<div className="mt-0.5 text-sm font-semibold tabular-nums">
								{formatMoney(calculation.revenueBaseTotalExact)}
							</div>
						</div>
					)}
				<div>
					<div className="text-xs text-muted-foreground">Full precision</div>
					<div className="mt-0.5 text-sm font-semibold tabular-nums text-muted-foreground">
						{EXACT_FORMATTER.format(calculation.grossExact)}
					</div>
				</div>
				<ChevronRight className="size-4 text-muted-foreground/60" />
				<div>
					<div className="text-xs text-muted-foreground">
						Computed{' '}
						<span className="text-muted-foreground/70">
							· banker&apos;s rounding
						</span>
					</div>
					<div className="mt-0.5 text-base font-bold tabular-nums text-primary">
						{formatMoney(period.grossAmount)}
					</div>
				</div>
			</div>

			{period.finalizedAt && (
				<div className="mt-3.5 border-t border-border pt-3 text-xs text-muted-foreground">
					Snapshot finalized {formatDate(period.finalizedAt)}
					{period.finalizedByName ? ` by ${period.finalizedByName}` : ''} —
					frozen, never recomputed.
				</div>
			)}
		</Card>
	);
}
