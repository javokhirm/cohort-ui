import { useNavigate } from '@tanstack/react-router';

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
 * Owns the row's anatomy (icon slot, label, OWNER-style badge) and its
 * collapsed/expanded transition, so the two chromes stay visually identical.
 */
export function NavButton({
	item,
	active,
	collapsed = false,
	size = 'compact',
	onNavigate,
}: NavButtonProps) {
	const navigate = useNavigate();
	const t = useT('nav');
	const { Icon } = item;
	const label = t(`item.${item.label}`);

	const button = (
		<button
			type="button"
			onClick={() => {
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				void navigate({ to: item.href as any });
				onNavigate?.();
			}}
			aria-current={active ? 'page' : undefined}
			className={cn(
				'flex w-full items-center overflow-hidden rounded-md transition-colors',
				size === 'touch' ? 'h-11 text-sm' : 'h-9 text-[13px]',
				active
					? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
					: 'text-muted-foreground hover:bg-muted hover:text-foreground',
			)}
		>
			{/* Icon slot — width transitions between centered (collapsed) and left-rail (expanded) */}
			<span
				className={cn(
					'flex shrink-0 items-center justify-center transition-[width] duration-220 ease-in-out',
					collapsed ? 'w-full' : size === 'touch' ? 'w-11' : 'w-9',
				)}
			>
				<Icon
					className={cn(
						'size-4 shrink-0',
						active ? 'text-sidebar-primary' : 'text-muted-foreground',
					)}
				/>
			</span>

			{/* Text + badge — fades quickly, clipped by button overflow-hidden */}
			<span
				style={{ transitionDelay: collapsed ? '0ms' : '80ms' }}
				className={cn(
					'flex flex-1 items-center gap-1.5 overflow-hidden whitespace-nowrap pr-2.5',
					'transition-opacity duration-120',
					collapsed ? 'opacity-0' : 'opacity-100',
				)}
			>
				<span className="flex-1 truncate text-left">{label}</span>
				{item.badge && (
					<span className="rounded-md bg-tone-amber-bg px-1.5 py-px text-[9.5px] font-bold uppercase tracking-wide text-tone-amber-fg">
						{item.badge}
					</span>
				)}
			</span>
		</button>
	);

	if (collapsed) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>{button}</TooltipTrigger>
				<TooltipContent side="right" sideOffset={8}>
					<span>{label}</span>
					{item.badge && (
						<span className="ml-1 text-[9px] font-bold text-tone-amber-fg">
							{item.badge}
						</span>
					)}
				</TooltipContent>
			</Tooltip>
		);
	}

	return button;
}
