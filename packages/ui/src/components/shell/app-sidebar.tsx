import { cn } from '@repo/ui/lib/utils';
import * as React from 'react';

export interface SidebarNavItem {
	id: string;
	label: string;
	icon: React.ReactNode;
	active?: boolean;
	/** Numeric badge (notification count, etc.) shown on the right. */
	badge?: string | number;
	onClick?: () => void;
}

export interface SidebarUser {
	name: string;
	initials: string;
	/** Human-readable role label (e.g. "MANAGER", "TEACHER"). */
	role: string;
}

interface AppSidebarProps extends React.ComponentProps<'aside'> {
	/** Brand mark rendered in the header (a styled div or img element). */
	logo: React.ReactNode;
	centerName: string;
	/** Surface label shown in monospace below the center name (e.g. "MANAGE"). */
	surface?: string;
	navItems: SidebarNavItem[];
	/**
	 * Identity footer. Optional: consoles that surface identity elsewhere (e.g. a
	 * topbar account menu) omit it and the footer isn't rendered.
	 */
	user?: SidebarUser;
	onUserClick?: () => void;
	/** Optional trailing slot in the user footer row (e.g. a dots-menu button). */
	userActions?: React.ReactNode;
}

/**
 * Desktop left sidebar shell used by MANAGE, TEACH, and PORTAL. Holds the
 * logo, primary nav items, and a user identity footer.
 */
function AppSidebar({
	className,
	logo,
	centerName,
	surface,
	navItems,
	user,
	onUserClick,
	userActions,
	...props
}: AppSidebarProps) {
	return (
		<aside
			data-slot="app-sidebar"
			className={cn(
				'flex w-[236px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar',
				className,
			)}
			{...props}
		>
			{/* Header */}
			<div className="flex h-[58px] shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4">
				<span className="shrink-0">{logo}</span>
				<div className="min-w-0">
					<div className="truncate text-[13.5px] font-bold tracking-tight text-sidebar-foreground">
						{centerName}
					</div>
					{surface && (
						<div className="font-mono text-[10px] text-muted-foreground">
							{surface}
						</div>
					)}
				</div>
			</div>

			{/* Nav */}
			<nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2.5">
				{navItems.map((item) => (
					<button
						key={item.id}
						type="button"
						onClick={item.onClick}
						className={cn(
							'flex h-10 w-full items-center gap-2.5 rounded-xl px-3 text-left text-[13.5px] transition-colors',
							item.active
								? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
								: 'font-medium text-sidebar-foreground hover:bg-muted',
						)}
					>
						<span
							className={cn(
								'flex shrink-0 [&>svg]:size-[18px]',
								item.active
									? 'text-sidebar-primary'
									: 'text-muted-foreground',
							)}
						>
							{item.icon}
						</span>
						<span className="min-w-0 flex-1 truncate">{item.label}</span>
						{item.badge !== undefined && (
							<span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
								{item.badge}
							</span>
						)}
					</button>
				))}
			</nav>

			{/* User footer */}
			{user && (
				<div className="shrink-0 border-t border-sidebar-border p-2.5">
					<button
						type="button"
						onClick={onUserClick}
						className="flex w-full items-center gap-2.5 rounded-xl p-2 transition-colors hover:bg-muted"
					>
						<div className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-tone-indigo-bg text-sm font-semibold text-tone-indigo-fg">
							{user.initials}
						</div>
						<div className="min-w-0 flex-1 text-left">
							<div className="truncate text-[12.5px] font-semibold text-foreground">
								{user.name}
							</div>
							<div className="mt-0.5">
								<span className="rounded-md bg-tone-indigo-bg px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-wide text-tone-indigo-fg">
									{user.role}
								</span>
							</div>
						</div>
						{userActions && <div className="shrink-0">{userActions}</div>}
					</button>
				</div>
			)}
		</aside>
	);
}

export { AppSidebar };
export type { AppSidebarProps };
