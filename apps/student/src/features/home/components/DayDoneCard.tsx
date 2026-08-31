import { CheckCircle2, ChevronRight, PartyPopper } from 'lucide-react';

import { Card, cn } from '@repo/ui';
import { formatTime } from '@repo/utils';

import type { NextClassInfo } from '../lib/next-class';
import { FOCUS_RING, clickableCardProps } from '@/lib/clickable-card';
import { useAppT } from '@/locales';

interface DayDoneCardProps {
	/** Always an `isDone` info — the day's last session, with today's completed tally. */
	info: NextClassInfo;
	/** Opens that last session's detail screen. */
	onOpen: () => void;
}

/**
 * Home's hero once every class today is behind the student: the payoff card.
 *
 * It is deliberately the quiet counterpart to `NextClassCard`. Nothing is
 * pending, so nothing here should compete for attention the way a countdown
 * does — it stays the app's ordinary panel and lets a single green chip and one
 * green line carry the "finished" reading. Green is an accent here, never a
 * field: the saturated surface on Home belongs to a class that still needs
 * showing up for.
 *
 * The tally is only claimed when there is one to claim. A day whose single class
 * was cancelled still lands here with `completedToday === 0`, and congratulating
 * a student for finishing zero classes would be a lie the card tells about their
 * own day — it says "nothing left today" instead.
 *
 * The whole card opens the last session, so it carries a button's role and
 * keyboard behaviour — see `lib/clickable-card.ts`.
 */
export function DayDoneCard({ info, onOpen }: DayDoneCardProps) {
	const t = useAppT('home');
	const { session, completedToday } = info;

	return (
		<Card
			{...clickableCardProps(onOpen)}
			className={cn(
				'cursor-pointer gap-0 py-0 transition-colors hover:border-primary',
				FOCUS_RING,
			)}
		>
			<div className="flex items-center gap-3 p-4">
				<span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-tone-green-bg text-tone-green-fg">
					<PartyPopper className="size-5" />
				</span>

				<div className="min-w-0 flex-1">
					<p className="text-sm font-bold text-foreground">
						{t('allDoneToday')}
					</p>
					<p className="mt-0.5 text-xs font-semibold text-tone-green-fg">
						{completedToday > 0
							? t('doneClasses', { count: completedToday })
							: t('noMoreClasses')}
					</p>
					<p className="mt-1 flex items-center gap-1.5 truncate text-xs text-muted-foreground">
						<CheckCircle2 className="size-3 shrink-0" />
						<span className="truncate">
							{session.groupName} · {formatTime(session.startTime)}
						</span>
					</p>
				</div>

				<ChevronRight className="size-4 shrink-0 text-muted-foreground" />
			</div>
		</Card>
	);
}
