import { useDashboard } from '@/features/dashboard/hooks';
import { ChartSkeleton } from '@/features/dashboard/components/ChartSkeleton';
import { DashboardContent } from '@/features/dashboard/components/DashboardContent';
import { KpiSkeleton } from '@/features/dashboard/components/KpiSkeleton';

export function DashboardPage() {
	const { data, isLoading, isError, error } = useDashboard();

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-6">
			<div>
				<h1 className="text-xl font-semibold">Dashboard</h1>
				<p className="text-sm text-muted-foreground">
					Platform overview and health
				</p>
			</div>

			{isLoading ? (
				<>
					<KpiSkeleton />
					<ChartSkeleton />
				</>
			) : isError ? (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					Failed to load dashboard data
					{error instanceof Error ? `: ${error.message}` : '.'}
				</div>
			) : data ? (
				<DashboardContent data={data} />
			) : null}
		</div>
	);
}
