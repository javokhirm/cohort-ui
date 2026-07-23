import type { StatusTone } from '@repo/ui';
import { EmptyState, ProgressBar } from '@repo/ui';
import { Users } from 'lucide-react';

import { useLeadFunnel } from '../api/dashboard.queries';
import type { LeadFunnelStatus } from '../api/types';
import { PanelSkeleton } from './DashboardSkeletons';
import { PanelCard } from './PanelCard';
import { PanelError } from './PanelError';
import { useAppT } from '@/locales';

const STAGE_META: Record<LeadFunnelStatus, { label: string; tone: StatusTone }> = {
	NEW: { label: 'New', tone: 'slate' },
	CONTACTED: { label: 'Contacted', tone: 'blue' },
	TRIAL_BOOKED: { label: 'Trial booked', tone: 'amber' },
	ENROLLED: { label: 'Enrolled', tone: 'green' },
	LOST: { label: 'Lost', tone: 'red' },
};

/** Lead funnel — stage-entry counts for the current week, as relative bars. */
export function LeadFunnelCard() {
	const t = useAppT('dashboard');
	const { data, isLoading, isError, refetch } = useLeadFunnel();

	if (isLoading) return <PanelSkeleton rows={5} />;
	if (isError || !data)
		return <PanelError title={t('card.leadFunnel')} onRetry={refetch} />;

	const max = Math.max(1, ...data.stages.map((s) => s.count));
	const hasAny = data.stages.some((s) => s.count > 0);

	return (
		<PanelCard title={t('card.leadFunnel')} subtitle={t('thisWeek')}>
			{!hasAny ? (
				<EmptyState
					icon={<Users />}
					title={t('card.noLeadActivityTitle')}
					description={t('card.noLeadActivityDescription')}
				/>
			) : (
				<div className="flex flex-col gap-4">
					{data.stages.map((stage) => {
						const meta = STAGE_META[stage.status];
						return (
							<div key={stage.status} className="flex flex-col gap-1.5">
								<div className="flex items-center justify-between">
									<span className="text-sm text-muted-foreground">
										{meta.label}
									</span>
									<span className="text-sm font-semibold tabular-nums">
										{stage.count}
									</span>
								</div>
								<ProgressBar
									value={(stage.count / max) * 100}
									tone={meta.tone}
								/>
							</div>
						);
					})}
				</div>
			)}
		</PanelCard>
	);
}
