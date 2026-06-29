import * as React from 'react';
import { BookOpen, MapPin, Users } from 'lucide-react';
import { StatusKind } from '@repo/ui/lib/status';
import { cn } from '@repo/ui/lib/utils';
import { StatusBadge } from '../status-badge';
import { Button } from '../button';

interface SessionCardAction {
	label: string;
	onClick: (e: React.MouseEvent) => void;
	variant?: 'default' | 'outline';
	icon?: React.ReactNode;
}

interface SessionCardProps extends Omit<React.ComponentProps<'div'>, 'onClick'> {
	startTime: string;
	endTime: string;
	groupName: string;
	courseName?: string;
	room?: string;
	/** Raw backend status value — resolved via `statusKind`. */
	status: string;
	statusKind?: StatusKind;
	topic?: string;
	studentCount?: number;
	action?: SessionCardAction;
	onClick?: (e: React.MouseEvent) => void;
}

function SessionCard({
	className,
	startTime,
	endTime,
	groupName,
	courseName,
	room,
	status,
	statusKind = 'session',
	topic,
	studentCount,
	action,
	onClick,
	...props
}: SessionCardProps) {
	return (
		<div
			data-slot="session-card"
			onClick={onClick}
			className={cn(
				'rounded-2xl border border-border bg-card p-3.5 shadow-sm',
				onClick && 'cursor-pointer hover:border-primary transition-colors',
				className,
			)}
			{...props}
		>
			<div className="flex items-start gap-3">
				{/* time block */}
				<div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl bg-muted py-2">
					<span className="text-[15px] font-bold tabular-nums text-foreground">
						{startTime}
					</span>
					<span className="text-[10.5px] tabular-nums text-muted-foreground">
						{endTime}
					</span>
				</div>

				{/* main content */}
				<div className="min-w-0 flex-1">
					<div className="flex items-center justify-between gap-2">
						<span className="truncate text-[14.5px] font-bold text-foreground">
							{groupName}
						</span>
						<StatusBadge
							kind={statusKind}
							status={status}
							className="shrink-0"
						/>
					</div>
					{(courseName || room) && (
						<div className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
							{courseName && <span>{courseName}</span>}
							{courseName && room && (
								<span className="h-[3px] w-[3px] rounded-full bg-muted-foreground/40" />
							)}
							{room && (
								<span className="flex items-center gap-1">
									<MapPin className="size-3" />
									{room}
								</span>
							)}
						</div>
					)}
				</div>
			</div>

			{topic && (
				<div className="mt-3 flex items-center gap-2 rounded-xl bg-muted px-2.5 py-2 text-xs text-muted-foreground">
					<BookOpen className="size-3.5 shrink-0" />
					<span className="truncate">{topic}</span>
				</div>
			)}

			{(studentCount !== undefined || action) && (
				<div className="mt-3 flex items-center justify-between">
					{studentCount !== undefined ? (
						<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
							<Users className="size-3.5" />
							{studentCount} students
						</span>
					) : (
						<span />
					)}
					{action && (
						<Button
							size="sm"
							variant={action.variant ?? 'outline'}
							onClick={action.onClick}
							className="h-9 gap-1.5"
						>
							{action.icon}
							{action.label}
						</Button>
					)}
				</div>
			)}
		</div>
	);
}

export { SessionCard };
export type { SessionCardProps, SessionCardAction };
