import { Link } from '@tanstack/react-router';

import { cn, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';
import { useT } from '@repo/i18n';

import type { NavItemDef } from './nav';

interface NavButtonProps {
	item: NavItemDef;
	active: boolean;
	/** Icon-only rail. Adds the label tooltip the collapsed rail needs. */
	collapsed?: boolean;
	/**
	 * `touch` raises the row to a 44px target for the phone drawer; `compact`
	 * keeps the desktop rail's 36px density. Two sizes rather than two
	 * components — the row's anatomy is identical either way.
	 */
	size?: 'compact' | 'touch';
	/** Fired after navigating — the drawer closes itself with this. */
	onNavigate?: () => void;
}

/**
 * One navigation destination, shared by the desktop rail and the phone drawer.
 * Owns the row's anatomy (icon + label, active/collapsed states) so the two
 * chromes stay visually identical.
 */
export function NavButton({
	item,
	active,
	collapsed = false,
	size = 'compact',
	onNavigate,
}: NavButtonProps) {
	const { Icon } = item;
	const t = useT('nav');
	const label = t(`item.${item.label}`);

	const link = (
		<Link
			to={item.href}
			onClick={onNavigate}
			aria-current={active ? 'page' : undefined}
			className={cn(
				'flex w-full items-center rounded-md text-sm transition-colors',
				size === 'touch' ? 'h-11' : 'h-9',
				collapsed ? 'justify-center' : 'gap-3 px-3',
				active
					? 'bg-(--console-accent) font-medium text-(--console-accent-fg)'
					: 'text-(--console-muted-fg) hover:bg-(--console-hover) hover:text-(--console-fg)',
			)}
		>
			<Icon className="size-4 shrink-0" />
			{!collapsed && <span className="truncate">{label}</span>}
		</Link>
	);

	if (collapsed) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>{link}</TooltipTrigger>
				<TooltipContent side="right" sideOffset={8}>
					{label}
				</TooltipContent>
			</Tooltip>
		);
	}

	return link;
}
