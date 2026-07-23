import {
	Bar,
	BarChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

import { formatMonthShort } from '@repo/utils';

import { useEnrollmentTrend } from '../api/dashboard.queries';
import { AXIS_TICK, CHART, TOOLTIP_STYLE } from './chartTheme';
import { ChartSkeleton } from './DashboardSkeletons';
import { PanelCard } from './PanelCard';
import { PanelError } from './PanelError';
import { TrendChip } from './TrendChip';
import { useAppT } from '@/locales';

/** Enrollment trend — new enrollments per month, last 12 months. */
export function EnrollmentTrendCard() {
	const t = useAppT('dashboard');
	const { data, isLoading, isError, refetch } = useEnrollmentTrend(12);

	if (isLoading) return <ChartSkeleton />;
	if (isError || !data)
		return <PanelError title={t('card.enrollmentTrend')} onRetry={refetch} />;

	const chartData = data.points.map((p) => ({
		month: formatMonthShort(p.month),
		enrollments: p.enrollments,
	}));

	return (
		<PanelCard
			title={t('card.enrollmentTrend')}
			subtitle={t('card.enrollmentTrendSubtitle')}
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
