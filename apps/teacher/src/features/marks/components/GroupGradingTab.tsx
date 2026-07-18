import { useState } from 'react';
import { ChevronRight, SlidersHorizontal } from 'lucide-react';

import { EmptyState, Skeleton } from '@repo/ui';

import { useGradingConfig } from '../api/grading-config.queries';
import { scaleShortLabel } from '../lib/scale';
import { GradingScaleSheet } from './GradingScaleSheet';

interface GroupGradingTabProps {
	groupId: number;
}

/**
 * The group screen's Grading tab: the scale daily marks are entered on, and the
 * way into changing it.
 *
 * Switching a scale is immutable on the backend — it inserts a new active config
 * and leaves marks already entered stamped with the old one — which is what the
 * explanatory card below the button is there to say.
 */
export function GroupGradingTab({ groupId }: GroupGradingTabProps) {
	const [scaleOpen, setScaleOpen] = useState(false);
	const { data, isPending, isError } = useGradingConfig(groupId);
	const current = data?.current ?? null;

	if (isPending) {
		return <Skeleton className="h-20 w-full rounded-xl" />;
	}

	if (isError) {
		return (
			<div className="rounded-xl border border-border bg-card">
				<EmptyState
					icon={<SlidersHorizontal />}
					title="Couldn't load the grading scale"
					description="Something went wrong fetching this group's grading configuration. Try again in a moment."
				/>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2.75">
			<button
				type="button"
				onClick={() => setScaleOpen(true)}
				className="flex w-full cursor-pointer items-center gap-3 rounded-xl border border-border bg-card p-3.5 text-left shadow-sm transition-colors hover:border-primary active:bg-muted/60 focus-visible:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
			>
				<span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
					<SlidersHorizontal className="size-4.5" />
				</span>
				<span className="min-w-0 flex-1">
					<span className="block text-[13.5px] font-bold text-foreground">
						Grading scale
					</span>
					<span className="block truncate text-[11.5px] text-muted-foreground">
						{current
							? `${scaleShortLabel(current)} · used for daily marks`
							: 'Not set yet · tap to choose one'}
					</span>
				</span>
				<ChevronRight className="size-4 shrink-0 text-muted-foreground/50" />
			</button>

			<p className="rounded-xl border border-border bg-card p-3.5 text-[12px] leading-relaxed text-muted-foreground shadow-xs">
				This scale controls how daily marks are entered and how averages are
				calculated for this group. Changing it does not convert marks already
				saved.
			</p>

			<GradingScaleSheet
				groupId={groupId}
				open={scaleOpen}
				onOpenChange={setScaleOpen}
			/>
		</div>
	);
}
