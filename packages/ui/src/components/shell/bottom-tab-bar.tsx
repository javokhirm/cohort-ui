import { cn } from '@repo/ui/lib/utils';
import * as React from 'react';

export interface BottomTabItem {
	id: string;
	label: string;
	icon: React.ReactNode;
	/** Alternate icon shown when the tab is active. Falls back to `icon`. */
	activeIcon?: React.ReactNode;
	active?: boolean;
	/** Notification count badge overlaid on the icon. */
	badge?: string | number;
	onClick?: () => void;
}

interface BottomTabBarProps extends React.ComponentProps<'nav'> {
	items: BottomTabItem[];
}

/**
 * Mobile bottom navigation bar used by MANAGE, TEACH, and PORTAL. Each tab
 * shows an icon + label and an optional numeric badge.
 */
function BottomTabBar({ className, items, ...props }: BottomTabBarProps) {
	return (
		<nav
			data-slot="bottom-tab-bar"
			className={cn('flex shrink-0 border-t border-border bg-card', className)}
			{...props}
		>
			{items.map((item) => (
				<button
					key={item.id}
					type="button"
					onClick={item.onClick}
					className={cn(
						'flex flex-1 flex-col items-center gap-1 pb-4 pt-2.5 transition-colors',
						item.active ? 'text-primary' : 'text-muted-foreground',
					)}
				>
					<span className="relative flex items-center justify-center [&>svg]:size-[22px]">
						{item.active && item.activeIcon ? item.activeIcon : item.icon}
						{item.badge !== undefined && (
							<span className="absolute -right-2.5 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">
								{item.badge}
							</span>
						)}
					</span>
					<span
						className={cn(
							'text-[10px] font-semibold',
							item.active ? 'text-primary' : 'text-muted-foreground',
						)}
					>
						{item.label}
					</span>
				</button>
			))}
		</nav>
	);
}

export { BottomTabBar };
export type { BottomTabBarProps };
