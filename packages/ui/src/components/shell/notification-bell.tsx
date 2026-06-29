import * as React from 'react';
import { Bell } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

export interface NotificationItem {
	id: string;
	title: string;
	description?: string;
	time?: string;
	unread?: boolean;
	/** Icon element shown in a tinted box on the left. */
	icon?: React.ReactNode;
	/** CSS background color for the icon box (e.g. `var(--color-tone-amber-bg)`). */
	iconBg?: string;
	/** CSS text color for the icon box. */
	iconColor?: string;
	onClick?: () => void;
}

interface NotificationBellProps {
	items?: NotificationItem[];
	/** Controls the red dot; omit or pass 0 to hide it. */
	unreadCount?: number;
	onMarkAllRead?: () => void;
	onViewAll?: () => void;
	panelTitle?: string;
	className?: string;
}

/**
 * Bell icon with a dropdown notification panel. Used in the topbar of every
 * app and in the ADMIN console header. Self-manages open/close state and
 * closes on outside click.
 */
function NotificationBell({
	items = [],
	unreadCount = 0,
	onMarkAllRead,
	onViewAll,
	panelTitle = 'Notifications',
	className,
}: NotificationBellProps) {
	const [open, setOpen] = React.useState(false);
	const containerRef = React.useRef<HTMLDivElement>(null);

	React.useEffect(() => {
		function onMouseDown(e: MouseEvent) {
			if (
				containerRef.current &&
				!containerRef.current.contains(e.target as Node)
			) {
				setOpen(false);
			}
		}
		document.addEventListener('mousedown', onMouseDown);
		return () => document.removeEventListener('mousedown', onMouseDown);
	}, []);

	return (
		<div ref={containerRef} className={cn('relative', className)}>
			<button
				type="button"
				onClick={() => setOpen((v) => !v)}
				className="relative flex size-9 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted"
			>
				<Bell className="size-[18px]" />
				{unreadCount > 0 && (
					<span className="absolute right-2 top-1.5 size-[7px] rounded-full border-[1.5px] border-card bg-destructive" />
				)}
			</button>

			{open && (
				<div className="absolute right-0 top-11 z-50 w-[340px] overflow-hidden rounded-xl border border-border bg-card shadow-xl animate-in fade-in-0 zoom-in-95">
					<div className="flex items-center justify-between border-b border-border px-4 py-3">
						<span className="text-[13.5px] font-bold text-foreground">
							{panelTitle}
						</span>
						{onMarkAllRead && (
							<button
								type="button"
								onClick={onMarkAllRead}
								className="text-xs font-semibold text-primary"
							>
								Mark all read
							</button>
						)}
					</div>

					<div className="max-h-[360px] overflow-y-auto">
						{items.length === 0 ? (
							<div className="px-4 py-8 text-center text-sm text-muted-foreground">
								No notifications
							</div>
						) : (
							items.map((n) => (
								<button
									key={n.id}
									type="button"
									onClick={() => {
										n.onClick?.();
										setOpen(false);
									}}
									className="flex w-full gap-2.5 border-b border-border px-4 py-3 text-left transition-colors last:border-0 hover:bg-muted"
								>
									{n.icon && (
										<span
											className="flex size-7 shrink-0 items-center justify-center rounded-lg [&>svg]:size-3.5"
											style={{
												background:
													n.iconBg ?? 'var(--color-muted)',
												color:
													n.iconColor ??
													'var(--color-muted-foreground)',
											}}
										>
											{n.icon}
										</span>
									)}
									<div className="min-w-0 flex-1">
										<div className="flex items-center gap-1.5">
											<span className="truncate text-[12.5px] font-semibold text-foreground">
												{n.title}
											</span>
											{n.unread && (
												<span className="size-1.5 shrink-0 rounded-full bg-primary" />
											)}
										</div>
										{n.description && (
											<p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">
												{n.description}
											</p>
										)}
										{n.time && (
											<div className="mt-1 text-[10.5px] text-muted-foreground">
												{n.time}
											</div>
										)}
									</div>
								</button>
							))
						)}
					</div>

					{onViewAll && (
						<div className="border-t border-border p-2">
							<button
								type="button"
								onClick={() => {
									onViewAll();
									setOpen(false);
								}}
								className="w-full rounded-xl px-3 py-2 text-center text-xs font-semibold text-primary transition-colors hover:bg-muted"
							>
								View all notifications
							</button>
						</div>
					)}
				</div>
			)}
		</div>
	);
}

export { NotificationBell };
export type { NotificationBellProps };
