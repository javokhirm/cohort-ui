import { ChevronRight } from 'lucide-react';

import { Card } from '@repo/ui';

import type { StudentLatestResult } from '../api/home.queries';
import { useAppT } from '@/locales';

interface LatestResultCardProps {
	result: StudentLatestResult;
	/** Opens the Progress screen's Grades tab. */
	onOpen: () => void;
}

export function LatestResultCard({ result, onOpen }: LatestResultCardProps) {
	const t = useAppT('home');

	return (
		<Card
			onClick={onOpen}
			className="cursor-pointer gap-0 py-0 transition-colors hover:border-primary"
		>
			<div className="flex flex-col gap-1 p-4">
				<div className="flex items-center justify-between gap-2">
					<span className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
						{t('latestResult')}
					</span>
					<ChevronRight className="size-4 shrink-0 text-muted-foreground" />
				</div>
				<div className="flex items-baseline gap-1.5">
					<span className="text-2xl font-extrabold tabular-nums tracking-tight text-foreground">
						{result.score ?? '—'}
					</span>
					<span className="text-sm font-medium text-muted-foreground">
						/ {result.maxScore}
					</span>
					{result.gradeLabel && (
						<span className="ml-1 rounded-md bg-tone-indigo-bg px-1.5 py-0.5 text-[11px] font-bold text-tone-indigo-fg">
							{result.gradeLabel}
						</span>
					)}
				</div>
				<span className="truncate text-[13px] font-semibold text-foreground">
					{result.title}
				</span>
				<span className="truncate text-xs text-muted-foreground">
					{result.groupName}
				</span>
			</div>
		</Card>
	);
}
