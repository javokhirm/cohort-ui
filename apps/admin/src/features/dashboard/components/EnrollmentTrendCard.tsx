import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

import { useEnrollmentTrend } from '../api/dashboard.queries';
import { AXIS_TICK, CHART, TOOLTIP_STYLE } from './chartTheme';
import { ChartSkeleton } from './DashboardSkeletons';
import { PanelCard } from './PanelCard';
import { PanelError } from './PanelError';
import { TrendChip } from './TrendChip';

/** `YYYY-MM` → short month label (`Jul`). */
function monthLabel(month: string): string {
	const date = new Date(`${month}-01T00:00:00`);
	return date.toLocaleString('en-US', { month: 'short' });
}

/** Enrollment trend — new enrollments per month, last 12 months. */
export function EnrollmentTrendCard() {
	const { data, isLoading, isError, refetch } = useEnrollmentTrend(12);

	if (isLoading) return <ChartSkeleton />;
	if (isError || !data)
		return <PanelError title="Enrollment trend" onRetry={refetch} />;

	const chartData = data.points.map((p) => ({
		month: monthLabel(p.month),
		enrollments: p.enrollments,
	}));

	return (
		<PanelCard
			title="Enrollment trend"
			subtitle="New enrollments / month"
			headerRight={
				data.changePct != null ? (
					<TrendChip value={data.changePct * 100} />
				) : undefined
			}
		>
			<ResponsiveContainer width="100%" height={180}>
				<BarChart data={chartData} margin={{ left: 0, right: 8, top: 4 }}>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke={CHART.grid}
						vertical={false}
					/>
					<XAxis
						dataKey="month"
						tick={AXIS_TICK}
						axisLine={false}
						tickLine={false}
					/>
					<YAxis
						tick={AXIS_TICK}
						axisLine={false}
						tickLine={false}
						width={28}
						allowDecimals={false}
					/>
					<Tooltip
						contentStyle={TOOLTIP_STYLE}
						cursor={{ fill: 'var(--muted)' }}
						formatter={(v) => [Number(v), 'Enrollments']}
					/>
					<Bar
						dataKey="enrollments"
						fill={CHART.enrollment}
						radius={[4, 4, 0, 0]}
					/>
				</BarChart>
			</ResponsiveContainer>
		</PanelCard>
	);
}
