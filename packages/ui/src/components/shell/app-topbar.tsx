import * as React from 'react';
import { ArrowLeft, Bell } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

interface AppTopbarProps extends React.ComponentProps<'header'> {
	title: string;
	subtitle?: string;
	/** When provided, a back-arrow button is prepended to the left. */
	onBack?: () => void;
	/** Right-side action slot (buttons, menus, locale switcher, etc.). */
	actions?: React.ReactNode;
	/**
	 * Leading slot, between the back button and the title — where the global
	 * `<BranchSwitcher>` goes. A slot rather than branch props: the topbar has no
	 * business knowing what a branch is, and each app wires the switcher to its
	 * own store.
	 */
	branch?: React.ReactNode;
	/** Shows a red unread dot on the notification bell icon. */
	hasNotifications?: boolean;
	onNotificationsClick?: () => void;
	/**
	 * Trailing slot, after the notification bell — where an identity avatar goes on the
	 * consoles whose phone layout has no sidebar to carry one.
	 */
	trailing?: React.ReactNode;
}

/**
 * Mobile/page topbar used by MANAGE, TEACH, and PORTAL. Provides back
 * navigation, an optional leading slot (the branch switcher), page title +
 * subtitle, actions, and a notification bell. Desktop apps compose this with
 * `AppSidebar` to form the full shell; mobile apps stack it above the content
 * area.
 */
function AppTopbar({
	className,
	title,
	subtitle,
	onBack,
	actions,
	branch,
	hasNotifications,
	onNotificationsClick,
	trailing,
	...props
}: AppTopbarProps) {
	return (
		<header
			data-slot="app-topbar"
			className={cn(
				'relative z-30 flex min-h-[54px] shrink-0 items-center gap-2.5 border-b border-border bg-card px-3.5 py-2',
				className,
			)}
			{...props}
		>
			{onBack && (
				<button
					type="button"
					onClick={onBack}
					className="-ml-1 flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted"
				>
					<ArrowLeft className="size-[18px]" />
				</button>
			)}

			{branch}

			<div className="min-w-0 flex-1">
				<div className="truncate text-[16.5px] font-bold tracking-tight text-foreground">
					{title}
				</div>
				{subtitle && (
					<div className="truncate text-[11.5px] text-muted-foreground">
						{subtitle}
					</div>
				)}
			</div>

			{actions}

			{onNotificationsClick && (
				<button
					type="button"
					onClick={onNotificationsClick}
					className="relative flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted"
				>
					<Bell className="size-[18px]" />
					{hasNotifications && (
						<span className="absolute right-2 top-1.5 size-[7px] rounded-full border-[1.5px] border-card bg-destructive" />
					)}
				</button>
			)}

			{trailing}
		</header>
	);
}

export { AppTopbar };
export type { AppTopbarProps };
