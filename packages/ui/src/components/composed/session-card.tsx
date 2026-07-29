import * as React from 'react';
import { BookOpen, MapPin, Users } from 'lucide-react';
import type { StatusKind } from '@repo/ui/lib/status';
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
	/**
	 * Localized status words for the badge. `@repo/ui` owns the badge's tone but
	 * not its copy — the label is pushed in (via `useStatusLabel`); without it the
	 * badge falls back to its built-in English label.
	 */
	statusLabel?: string;
	topic?: string;
	studentCount?: number;
	/**
	 * Localized label for the student count. `@repo/ui` can't depend on i18n, so
	 * the label is pushed in; defaults to English (`"N students"`).
	 */
	formatStudentCount?: (count: number) => string;
	/** A single footer action. Prefer `actions` when there is more than one. */
	action?: SessionCardAction;
	/**
	 * Footer actions. One action renders inline beside the student count; two or
	 * more stack onto their own full-width row below it. Takes precedence over
	 * `action`.
	 */
	actions?: SessionCardAction[];
	onClick?: (e: React.MouseEvent) => void;
}

function defaultStudentCount(count: number): string {
	return `${count} ${count === 1 ? 'student' : 'students'}`;
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
	statusLabel,
	topic,
	studentCount,
	formatStudentCount = defaultStudentCount,
	action,
	actions,
	onClick,
	...props
}: SessionCardProps) {
	const resolvedActions = actions ?? (action ? [action] : []);
	const hasStudentCount = studentCount !== undefined;
	const stackActions = resolvedActions.length >= 2;
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
						>
							{statusLabel}
						</StatusBadge>
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

			{(hasStudentCount || resolvedActions.length > 0) &&
				(stackActions ? (
					<div className="mt-3 space-y-3">
						{hasStudentCount && (
							<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
								<Users className="size-3.5" />
								{formatStudentCount(studentCount)}
							</span>
						)}
						<div className="flex gap-2">
							{resolvedActions.map((a, i) => (
								<Button
									key={i}
									size="sm"
									variant={a.variant ?? 'outline'}
									onClick={a.onClick}
									className="h-10 flex-1 gap-1.5"
								>
									{a.icon}
									{a.label}
								</Button>
							))}
						</div>
					</div>
				) : (
					<div className="mt-3 flex items-center justify-between">
						{hasStudentCount ? (
							<span className="flex items-center gap-1.5 text-xs text-muted-foreground">
								<Users className="size-3.5" />
								{formatStudentCount(studentCount)}
							</span>
						) : (
							<span />
						)}
						{resolvedActions[0] && (
							<Button
								size="sm"
								variant={resolvedActions[0].variant ?? 'outline'}
								onClick={resolvedActions[0].onClick}
								className="h-9 gap-1.5"
							>
								{resolvedActions[0].icon}
								{resolvedActions[0].label}
							</Button>
						)}
					</div>
				))}
		</div>
	);
}

export { SessionCard };
export type { SessionCardProps, SessionCardAction };
