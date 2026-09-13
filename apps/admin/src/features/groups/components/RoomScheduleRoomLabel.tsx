import { AlertTriangle } from 'lucide-react';

import { Badge, cn } from '@repo/ui';
import { useStatusLabel } from '@repo/i18n';
import { useAppT } from '@/locales';

import type { AllocationRow } from '../lib/room-allocation';

interface RoomScheduleRoomLabelProps {
	row: AllocationRow;
	/** Only worth a branch name when the selection actually spans branches. */
	showBranch: boolean;
	/** Pass any value to show the free/occupied line; omit to leave it out. */
	windowMinutes?: number;
}

/**
 * The identity of one row of the room schedule: what the room is, how much of
 * the day it is carrying, and whether it needs attention. Shared by the desktop
 * timeline and the mobile list so the two never describe a room differently.
 */
export function RoomScheduleRoomLabel({
	row,
	showBranch,
	windowMinutes,
}: RoomScheduleRoomLabelProps) {
	const t = useAppT('groups');
	const tr = useAppT('rooms');
	const statusLabel = useStatusLabel();

	const unplaced = row.roomId === null;
	const name = unplaced ? t('schedule.rooms.unassigned') : row.name;
	const meta = [
		showBranch ? row.branchName : null,
		row.capacity != null ? tr('seats', { count: row.capacity }) : null,
		row.type ? statusLabel('room', row.type) : null,
	]
		.filter(Boolean)
		.join(' · ');

	return (
		<div className="flex min-w-0 flex-col gap-1">
			<div className="flex min-w-0 items-center gap-1.5">
				<span
					className={cn(
						'truncate text-sm font-semibold',
						unplaced ? 'text-tone-amber-fg' : 'text-foreground',
					)}
					title={name}
				>
					{name}
				</span>
				{!row.isActive && (
					<Badge variant="outline" className="shrink-0 px-1 py-0 text-[10px]">
						{t('schedule.rooms.retired')}
					</Badge>
				)}
				{row.conflictCount > 0 && (
					<Badge
						variant="destructive"
						className="shrink-0 px-1 py-0 text-[10px]"
						title={t('schedule.rooms.conflict')}
					>
						<AlertTriangle />
						{row.conflictCount}
					</Badge>
				)}
			</div>

			{meta && (
				<span className="truncate text-[11px] text-muted-foreground" title={meta}>
					{meta}
				</span>
			)}

			{windowMinutes != null && !unplaced && row.blocks.length === 0 && (
				<span className="text-[11px] font-medium text-tone-green-fg">
					{t('schedule.rooms.free')}
				</span>
			)}
		</div>
	);
}
