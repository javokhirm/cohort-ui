import {
	Area,
	AreaChart,
	CartesianGrid,
	ResponsiveContainer,
	Tooltip,
	XAxis,
	YAxis,
} from 'recharts';

import { formatPriceAxis, formatPriceCompact } from '@repo/utils';

import { useRevenueTrend } from '../api/dashboard.queries';
import { AXIS_TICK, CHART, TOOLTIP_STYLE } from './chartTheme';
import { ChartSkeleton } from './DashboardSkeletons';
import { PanelCard } from './PanelCard';
import { PanelError } from './PanelError';
import { TrendChip } from './TrendChip';
import { useAppT } from '@/locales';

/** `YYYY-MM` → short month label (`Jul`). */
function monthLabel(month: string): string {
	const date = new Date(`${month}-01T00:00:00`);
	return date.toLocaleString('en-US', { month: 'short' });
}

/** Revenue trend — settled payments per month, last 12 months. */
export function RevenueTrendCard() {
	const t = useAppT('dashboard');
	const { data, isLoading, isError, refetch } = useRevenueTrend(12);

	if (isLoading) return <ChartSkeleton />;
	if (isError || !data)
		return <PanelError title={t('card.revenueTrend')} onRetry={refetch} />;

	const chartData = data.points.map((p) => ({
		month: monthLabel(p.month),
		revenue: p.revenue,
	}));

	return (
		<PanelCard
			title={t('card.revenueTrend')}
			subtitle={t('card.revenueTrendSubtitle')}
			headerRight={
				data.changePct != null ? (
					<TrendChip value={data.changePct * 100} />
				) : undefined
			}
		>
			<ResponsiveContainer width="100%" height={180}>
				<AreaChart data={chartData} margin={{ left: 0, right: 8, top: 4 }}>
					<defs>
						<linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
							<stop
								offset="0%"
								stopColor={CHART.revenue}
								stopOpacity={0.25}
							/>
							<stop
								offset="100%"
								stopColor={CHART.revenue}
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
						dataKey="month"
						tick={AXIS_TICK}
						axisLine={false}
						tickLine={false}
					/>
					<YAxis
						tick={AXIS_TICK}
						axisLine={false}
						tickLine={false}
						width={40}
						tickFormatter={(v: number) => formatPriceAxis(v)}
					/>
					<Tooltip
						contentStyle={TOOLTIP_STYLE}
						formatter={(v) => [formatPriceCompact(Number(v)), 'Revenue']}
					/>
					<Area
						type="monotone"
						dataKey="revenue"
						stroke={CHART.revenue}
						strokeWidth={2}
						fill="url(#revenueFill)"
						activeDot={{ r: 4 }}
					/>
				</AreaChart>
			</ResponsiveContainer>
		</PanelCard>
	);
}
