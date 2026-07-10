import { useDashboardStats } from '@/features/dashboard/api/dashboard.queries';
import { AttendanceTrendCard } from '@/features/dashboard/components/AttendanceTrendCard';
import { DashboardHeader } from '@/features/dashboard/components/DashboardHeader';
import { KpiStripSkeleton } from '@/features/dashboard/components/DashboardSkeletons';
import { EnrollmentTrendCard } from '@/features/dashboard/components/EnrollmentTrendCard';
import { LeadFunnelCard } from '@/features/dashboard/components/LeadFunnelCard';
import { OverdueInvoicesCard } from '@/features/dashboard/components/OverdueInvoicesCard';
import { PanelError } from '@/features/dashboard/components/PanelError';
import { RecentPaymentsCard } from '@/features/dashboard/components/RecentPaymentsCard';
import { RevenueTrendCard } from '@/features/dashboard/components/RevenueTrendCard';
import { StatsStrip } from '@/features/dashboard/components/StatsStrip';
import { TodaySessionsCard } from '@/features/dashboard/components/TodaySessionsCard';

/** The KPI strip owns its own loading/error state; the rest self-fetch. */
function StatsSection() {
	const { data, isLoading, isError, refetch } = useDashboardStats();
	if (isLoading) return <KpiStripSkeleton />;
	if (isError || !data) return <PanelError title="Overview" onRetry={refetch} />;
	return <StatsStrip data={data} />;
}

/**
 * The staff back-office home screen. Each panel fetches and fails on its own, so
 * one slow query never blocks the rest of the dashboard. Every query is scoped to
 * the active branch selection, so switching branches refetches the whole board.
 */
export function DashboardPage() {
	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-6">
			<DashboardHeader />

			<StatsSection />

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<RevenueTrendCard />
				<EnrollmentTrendCard />
				<AttendanceTrendCard />
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<TodaySessionsCard />
				</div>
				<OverdueInvoicesCard />
			</div>

			<div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
				<div className="lg:col-span-2">
					<RecentPaymentsCard />
				</div>
				<LeadFunnelCard />
			</div>
		</div>
	);
}
