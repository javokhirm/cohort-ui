import type { ComponentType } from 'react';
import { DoorOpen, FlaskConical, Pencil, Users, Video } from 'lucide-react';

import { Card, cn, StatusBadge, TONE_CLASSES } from '@repo/ui';

import { Can } from '@/components/Can';

import type { RoomResponse, RoomType } from '../api/rooms.queries';

interface RoomCardProps {
	room: RoomResponse;
	branchName: string;
	onEdit?: (room: RoomResponse) => void;
}

const TYPE_STYLE: Record<
	RoomType,
	{ icon: ComponentType<{ className?: string }>; classes: string }
> = {
	classroom: { icon: DoorOpen, classes: TONE_CLASSES.indigo },
	lab: { icon: FlaskConical, classes: TONE_CLASSES.amber },
	online: { icon: Video, classes: TONE_CLASSES.green },
};

export function RoomCard({ room, branchName, onEdit }: RoomCardProps) {
	const style = room.type ? TYPE_STYLE[room.type] : null;
	const Icon = style?.icon ?? DoorOpen;

	return (
		<Card className="gap-0 p-5">
			<div className="flex items-start justify-between">
				<span
					className={cn(
						'flex size-10 shrink-0 items-center justify-center rounded-lg',
						style?.classes ?? 'bg-muted text-muted-foreground',
					)}
				>
					<Icon className="size-5" />
				</span>

				<div className="flex shrink-0 items-center gap-2">
					{room.type && <StatusBadge kind="room" status={room.type} />}
					{onEdit && (
						<Can permission="room.update">
							<button
								type="button"
								onClick={() => onEdit(room)}
								aria-label={`Edit ${room.name}`}
								className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
							>
								<Pencil className="size-4" />
							</button>
						</Can>
					)}
				</div>
			</div>

			<div className="mt-4">
				<div className="flex items-center gap-2">
					<h3 className="truncate font-semibold text-foreground">
						{room.name}
					</h3>
					<span
						className={cn(
							'size-2 shrink-0 rounded-full',
							room.isActive ? 'bg-tone-green-fg' : 'bg-tone-slate-fg',
						)}
						aria-label={room.isActive ? 'Active' : 'Inactive'}
					/>
				</div>
				<p className="mt-0.5 truncate text-sm text-muted-foreground">
					{branchName}
				</p>
			</div>

			<div className="mt-4 flex items-center gap-2 border-t border-border pt-3 text-sm text-muted-foreground">
				<Users className="size-3.5 shrink-0" />
				<span className="tabular-nums">
					{room.capacity === 1 ? '1 seat' : `${room.capacity} seats`}
				</span>
			</div>
		</Card>
	);
}
