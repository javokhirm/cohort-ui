import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

import { useAttendanceTrend } from '../api/dashboard.queries';
import { AXIS_TICK, CHART, TOOLTIP_STYLE } from './chartTheme';
import { ChartSkeleton } from './DashboardSkeletons';
import { PanelCard } from './PanelCard';
import { PanelError } from './PanelError';

/** `YYYY-MM-DD` → day-of-month label (`24`). */
function dayLabel(date: string): string {
	return String(Number(date.slice(8, 10)));
}

/** Attendance trend — daily rate, last 14 days. */
export function AttendanceTrendCard() {
	const { data, isLoading, isError, refetch } = useAttendanceTrend(14);

	if (isLoading) return <ChartSkeleton />;
	if (isError || !data)
		return <PanelError title="Attendance trend" onRetry={refetch} />;

	const chartData = data.points.map((p) => ({
		day: dayLabel(p.date),
		rate: p.rate,
	}));

	return (
		<PanelCard
			title="Attendance trend"
			subtitle="Daily rate, last 14 days"
			headerRight={
				data.rate != null ? (
					<span className="text-sm font-semibold tabular-nums text-tone-green-fg">
						{data.rate}%
					</span>
				) : undefined
			}
		>
			<ResponsiveContainer width="100%" height={180}>
				<AreaChart data={chartData} margin={{ left: 0, right: 8, top: 4 }}>
					<defs>
						<linearGradient id="attendanceFill" x1="0" y1="0" x2="0" y2="1">
							<stop
								offset="0%"
								stopColor={CHART.attendance}
								stopOpacity={0.25}
							/>
							<stop
								offset="100%"
								stopColor={CHART.attendance}
								stopOpacity={0}
							/>
						</linearGradient>
					</defs>
					<CartesianGrid
						strokeDasharray="3 3"
						stroke={CHART.grid}
						vertical={false}
					/>
					<XAxis
						dataKey="day"
						tick={AXIS_TICK}
						axisLine={false}
						tickLine={false}
					/>
					<YAxis
						tick={AXIS_TICK}
						axisLine={false}
						tickLine={false}
						width={32}
						domain={[0, 100]}
						tickFormatter={(v: number) => `${v}%`}
					/>
					<Tooltip
						contentStyle={TOOLTIP_STYLE}
						formatter={(v) => [v != null ? `${Number(v)}%` : '—', 'Rate']}
					/>
					<Area
						type="monotone"
						dataKey="rate"
						stroke={CHART.attendance}
						strokeWidth={2}
						fill="url(#attendanceFill)"
						connectNulls
						activeDot={{ r: 4 }}
					/>
				</AreaChart>
			</ResponsiveContainer>
		</PanelCard>
	);
}
