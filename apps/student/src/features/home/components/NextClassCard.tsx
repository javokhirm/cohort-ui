import { BookOpen, ChevronRight, Hourglass, MapPin, Radio, User } from 'lucide-react';

import { Card, ProgressBar, cn } from '@repo/ui';
import { formatTime } from '@repo/utils';

import type { NextClassInfo } from '../lib/next-class';
import { FOCUS_RING, clickableCardProps } from '@/lib/clickable-card';
import { useAppT } from '@/locales';

interface NextClassCardProps {
	/** Never a finished day — `routes/home.tsx` sends `isDone` to `DayDoneCard` instead. */
	info: NextClassInfo;
	/** Opens the session's detail screen. */
	onOpen: () => void;
}

/**
 * Home's hero: the class that is running right now, or the next one due today.
 *
 * It is the screen's **one** saturated surface. Every other card on Home is the
 * app's ordinary white panel on the slate canvas, so a student's eye lands here
 * first without this card having to raise its voice — which is why nothing else
 * on Home is allowed a coloured field, and why this one needs no decoration of
 * its own to lead.
 *
 * `primary-foreground` on `primary` is about 4.4:1 in dark mode, so nothing here
 * fills a chip with translucent white: the pills take their shape from a ring
 * instead. Live and next therefore differ by icon and pulse, not by pill
 * contrast — both wear the same solid inverted pill.
 *
 * It closes on a `card` tray holding the countdown. That split is what keeps the
 * card both loud and legible: the brand field carries only large
 * `primary-foreground` type, while the small ticking copy sits on a white panel
 * at full contrast in either theme.
 *
 * State is carried by more than colour: live swaps in a radio icon, fills a
 * progress bar and prints the percentage; upcoming shows an hourglass and a
 * countdown alone. The countdown ticks because `info` is recomputed from
 * `useNow()` upstream — the card only renders whatever minute it was handed.
 *
 * The whole card opens the session, so it carries a button's role and keyboard
 * behaviour — see `lib/clickable-card.ts`.
 */
export function NextClassCard({ info, onOpen }: NextClassCardProps) {
	const t = useAppT('home');
	const { session, isLive, progressPct, minutesToStart, minutesLeft } = info;

	const hours = Math.floor(minutesToStart / 60);
	const spareMinutes = minutesToStart % 60;
	// Four phrasings rather than one template: "in 0 min" and "in 2 h 0 min" are
	// both things a clock says and a person does not.
	const countdown = isLive
		? t('minutesLeft', { minutes: minutesLeft })
		: minutesToStart < 1
			? t('startingNow')
			: minutesToStart < 60
				? t('startsInMin', { minutes: minutesToStart })
				: spareMinutes === 0
					? t('startsInHourOnly', { hours })
					: t('startsInHour', { hours, minutes: spareMinutes });

	return (
		<Card
			{...clickableCardProps(onOpen)}
			className={cn(
				'cursor-pointer gap-0 overflow-hidden border-transparent bg-primary py-0 shadow-sm',
				FOCUS_RING,
			)}
		>
			<div className="flex flex-col gap-3 p-4 text-primary-foreground sm:p-5">
				<div className="flex items-center gap-2">
					<span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
						{isLive ? (
							<>
								<Radio className="size-3" />
								{t('liveNow')}
							</>
						) : (
							<>
								<Hourglass className="size-3" />
								{t('nextClass')}
							</>
						)}
					</span>
					<span className="ml-auto shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold tabular-nums ring-1 ring-inset ring-primary-foreground/35">
						{formatTime(session.startTime)}–{formatTime(session.endTime)}
					</span>
				</div>

				<div className="flex items-start gap-2">
					<div className="min-w-0 flex-1">
						<p className="text-xl font-bold leading-tight tracking-tight sm:text-2xl">
							{session.groupName}
						</p>
						{(session.roomName || session.teacherName) && (
							<div className="mt-2 flex flex-wrap items-center gap-1.5">
								{session.roomName && (
									<span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-primary-foreground/35">
										<MapPin className="size-3" />
										{session.roomName}
									</span>
								)}
								{session.teacherName && (
									<span className="inline-flex min-w-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ring-inset ring-primary-foreground/35">
										<User className="size-3 shrink-0" />
										<span className="truncate">
											{session.teacherName}
										</span>
									</span>
								)}
							</div>
						)}
					</div>
					<span className="flex size-8 shrink-0 items-center justify-center rounded-full ring-1 ring-inset ring-primary-foreground/35">
						<ChevronRight className="size-4.5" />
					</span>
				</div>

				{session.topic && (
					<div className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium ring-1 ring-inset ring-primary-foreground/35">
						<BookOpen className="size-3.5 shrink-0" />
						<span className="truncate">{session.topic}</span>
					</div>
				)}
			</div>

			{/* The ticking half: a white tray under the brand field, so small copy sits
			    at full contrast in either theme. */}
			<div className="flex items-center gap-3 bg-card px-4 py-3 sm:px-5">
				<span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-tone-indigo-bg text-tone-indigo-fg">
					{isLive ? (
						<Radio className="size-4.5" />
					) : (
						<Hourglass className="size-4.5" />
					)}
				</span>
				<div className="min-w-0 flex-1">
					<p className="truncate text-sm font-semibold tabular-nums text-foreground">
						{countdown}
					</p>
					{isLive && (
						<div className="mt-1.5 flex items-center gap-2">
							<ProgressBar
								value={progressPct}
								tone="indigo"
								className="flex-1"
							/>
							<span className="shrink-0 text-[11px] font-semibold tabular-nums text-muted-foreground">
								{Math.round(progressPct)}%
							</span>
						</div>
					)}
				</div>
			</div>
		</Card>
	);
}
