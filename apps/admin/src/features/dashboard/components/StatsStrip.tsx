import { CalendarCheck, CircleDollarSign, Filter, Users, Wallet } from 'lucide-react';

import { StatCard } from '@repo/ui';
import { formatNumber, formatPriceCompact } from '@repo/utils';

import type { DashboardStats } from '../api/types';
import { TrendChip } from './TrendChip';

/** Signed count (e.g. `+12`), for the count-based deltas. */
function signed(n: number): string {
	return `${n >= 0 ? '+' : '−'}${Math.abs(n)}`;
}

/** The five KPI tiles. Each shows a value plus its comparison baseline. */
export function StatsStrip({ data }: { data: DashboardStats }) {
	const { activeStudents, attendanceToday, revenueThisMonth, outstanding, newLeads } =
		data;

	return (
		<div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
			<StatCard
				label="Active students"
				value={formatNumber(activeStudents.total)}
				icon={<Users />}
				delta={{
					value: signed(activeStudents.newThisMonth),
					trend: activeStudents.newThisMonth > 0 ? 'positive' : 'neutral',
				}}
				hint="this month"
			/>

			<StatCard
				label="Attendance today"
				value={attendanceToday.rate != null ? `${attendanceToday.rate}%` : '—'}
				icon={<CalendarCheck />}
				delta={
					attendanceToday.changePoints != null
						? { value: <TrendChip value={attendanceToday.changePoints} /> }
						: undefined
				}
				hint="vs last week"
			/>

			<StatCard
				label="Revenue this month"
				value={formatPriceCompact(revenueThisMonth.amount)}
				icon={<CircleDollarSign />}
				delta={
					revenueThisMonth.changePct != null
						? {
								value: (
									<TrendChip value={revenueThisMonth.changePct * 100} />
								),
							}
						: undefined
				}
				hint="UZS"
			/>

			<StatCard
				label="Outstanding"
				value={formatPriceCompact(outstanding.amount)}
				icon={<Wallet />}
				delta={{
					value: `${outstanding.overdueCount} overdue`,
					trend: outstanding.overdueCount > 0 ? 'negative' : 'neutral',
				}}
				hint="UZS"
			/>

			<StatCard
				label="New leads"
				value={formatNumber(newLeads.thisWeek)}
				icon={<Filter />}
				delta={{
					value: signed(newLeads.change),
					trend: newLeads.change > 0 ? 'positive' : 'neutral',
				}}
				hint="this week"
			/>
		</div>
	);
}
