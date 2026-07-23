import { Pencil, Users } from 'lucide-react';

import { Card, cn, StatusBadge } from '@repo/ui';
import { useStatusLabel, useT } from '@repo/i18n';

import { Can } from '@/components/Can';
import { useAppT } from '@/locales';

import type { RoomResponse } from '../api/rooms.queries';

interface RoomCardProps {
	room: RoomResponse;
	branchName: string;
	onEdit?: (room: RoomResponse) => void;
}

export function RoomCard({ room, branchName, onEdit }: RoomCardProps) {
	const t = useAppT('rooms');
	const tc = useT('common');
	const statusLabel = useStatusLabel();

	return (
		<Card className="gap-0 p-5">
			<div className="flex items-start justify-between gap-2">
				<div className="flex min-w-0 items-center gap-2">
					<h3 className="truncate text-xl font-semibold text-foreground">
						{room.name}
					</h3>
					<span
						className={cn(
							'size-2 shrink-0 rounded-full',
							room.isActive ? 'bg-tone-green-fg' : 'bg-tone-slate-fg',
						)}
						aria-label={
							room.isActive ? tc('state.active') : tc('state.inactive')
						}
					/>
				</div>

				<div className="flex shrink-0 items-center gap-2">
					{room.type && (
						<StatusBadge kind="room" status={room.type}>
							{statusLabel('room', room.type)}
						</StatusBadge>
					)}
					{onEdit && (
						<Can permission="room.update">
							<button
								type="button"
								onClick={() => onEdit(room)}
								aria-label={t('editAria', { name: room.name })}
								className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							>
								<Pencil className="size-4" />
							</button>
						</Can>
					)}
				</div>
			</div>

			<p className="mt-0.5 truncate text-sm text-muted-foreground">{branchName}</p>

			<div className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
				<Users className="size-3.5 shrink-0" />
				<span className="tabular-nums">
					{t('seats', { count: room.capacity })}
				</span>
			</div>
		</Card>
	);
}
