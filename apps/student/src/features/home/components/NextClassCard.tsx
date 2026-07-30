import { BookOpen, Check, Clock, MapPin, Play } from 'lucide-react';

import { Card, ProgressBar, StatusBadge } from '@repo/ui';
import { formatTime } from '@repo/utils';

import type { NextClassInfo } from '../lib/next-class';
import { useAppT } from '@/locales';

interface NextClassCardProps {
	info: NextClassInfo;
}

/** The Home screen's hero: today's current or next class, or a quiet "done for today" state. */
export function NextClassCard({ info }: NextClassCardProps) {
	const t = useAppT('home');
	const { session, isLive, isDone, progressPct } = info;

	return (
		<Card className="gap-0 py-0">
			<div className="flex flex-col gap-3.5 p-4">
				<div className="flex items-center gap-2">
					<StatusBadge tone={isDone ? 'slate' : isLive ? 'indigo' : 'blue'}>
						{isDone ? <Check /> : isLive ? <Play /> : <Clock />}
						{isDone
							? t('allDoneToday')
							: isLive
								? t('classInProgress')
								: t('nextClass')}
					</StatusBadge>
					<span className="ml-auto shrink-0 text-[12.5px] font-semibold tabular-nums text-muted-foreground">
						{formatTime(session.startTime)}–{formatTime(session.endTime)}
					</span>
				</div>

				<div>
					<p className="text-[17px] font-bold tracking-tight text-foreground">
						{session.groupName}
					</p>
					{(session.roomName || session.teacherName) && (
						<div className="mt-1 flex flex-wrap items-center gap-1.5 text-[12.5px] text-muted-foreground">
							{session.roomName && (
								<span className="flex items-center gap-1">
									<MapPin className="size-3.5" />
									{session.roomName}
								</span>
							)}
							{session.roomName && session.teacherName && (
								<span className="size-0.75 shrink-0 rounded-full bg-muted-foreground/40" />
							)}
							{session.teacherName && <span>{session.teacherName}</span>}
						</div>
					)}
				</div>

				{session.topic && (
					<div className="flex items-center gap-2 rounded-xl bg-tone-indigo-bg px-3 py-2.5 text-[12.5px] font-semibold text-tone-indigo-fg">
						<BookOpen className="size-3.5 shrink-0" />
						<span className="truncate">{session.topic}</span>
					</div>
				)}

				{isLive && <ProgressBar value={progressPct} tone="indigo" />}
			</div>
		</Card>
	);
}
