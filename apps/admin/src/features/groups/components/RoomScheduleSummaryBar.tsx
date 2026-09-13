import { AlertTriangle, CalendarClock, DoorOpen, MapPinOff } from 'lucide-react';

import { Card, cn } from '@repo/ui';
import { useAppT } from '@/locales';

import type { RoomScheduleSummary } from '../api/room-schedule.queries';

interface RoomScheduleSummaryBarProps {
	summary: RoomScheduleSummary;
}

/** One cell of the strip. Private: it only ever appears in this bar. */
function Metric({
	icon,
	label,
	value,
	hint,
	tone,
}: {
	icon: React.ReactNode;
	label: string;
	value: string;
	hint?: string | null;
	tone?: 'default' | 'destructive' | 'warning';
}) {
	return (
		<div className="flex flex-col gap-1.5 bg-card p-3 sm:p-4">
			<span className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
				<span className="[&>svg]:size-3.5">{icon}</span>
				{label}
			</span>
			<span
				className={cn(
					'text-xl font-bold tabular-nums leading-none',
					tone === 'destructive' && 'text-destructive',
					tone === 'warning' && 'text-tone-amber-fg',
				)}
			>
				{value}
			</span>
			{hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
		</div>
	);
}

/**
 * The day in four numbers, above the timeline: how much of the estate is in
 * use, how many classes run, and the two things that need an admin's attention
 * — double-bookings and classes with nowhere to be. A zero here is worth
 * showing: "no conflicts today" is the answer someone came to the page for.
 */
export function RoomScheduleSummaryBar({ summary }: RoomScheduleSummaryBarProps) {
	const t = useAppT('groups');

	return (
		<Card className="gap-0 overflow-hidden p-0">
			<div className="grid grid-cols-2 gap-px bg-border sm:grid-cols-4">
				<Metric
					icon={<DoorOpen />}
					label={t('schedule.rooms.summary.inUse')}
					value={`${summary.occupiedRoomCount}/${summary.roomCount}`}
				/>

				<Metric
					icon={<CalendarClock />}
					label={t('schedule.rooms.summary.classes')}
					value={String(summary.sessionCount)}
				/>

				<Metric
					icon={<AlertTriangle />}
					label={t('schedule.rooms.summary.conflicts')}
					value={String(summary.conflictCount)}
					tone={summary.conflictCount > 0 ? 'destructive' : 'default'}
					hint={
						summary.conflictCount > 0
							? t('schedule.rooms.summary.conflictsHint')
							: t('schedule.rooms.summary.allClear')
					}
				/>

				<Metric
					icon={<MapPinOff />}
					label={t('schedule.rooms.summary.unplaced')}
					value={String(summary.unassignedCount)}
					tone={summary.unassignedCount > 0 ? 'warning' : 'default'}
					hint={
						summary.unassignedCount > 0
							? t('schedule.rooms.summary.unplacedHint')
							: null
					}
				/>
			</div>
		</Card>
	);
}
