import { useState } from 'react';
import { ChevronRight } from 'lucide-react';

import { cn } from '@repo/ui';
import { useT } from '@repo/i18n';

import type { NavItemDef } from './nav';
import { NavButton } from './NavButton';

interface NavSectionProps {
	/** A nav item carrying `items` — the section header and its destinations. */
	item: NavItemDef;
	pathname: string;
	/** Icon-only rail. The section flattens to its children (see below). */
	collapsed?: boolean;
	size?: 'compact' | 'touch';
	/** Fired after navigating — the drawer closes itself with this. */
	onNavigate?: () => void;
}

/**
 * An expandable nav section — a header row that folds a handful of related
 * destinations away, used where several screens answer variations of one
 * question (the three schedule views).
 *
 * The header is **not** a destination: clicking it opens or closes the section
 * rather than navigating, so a user never lands somewhere by trying to see
 * what's inside.
 *
 * On the collapsed rail the section flattens into its children — one icon per
 * destination, each with its own tooltip. That rail is already a flat icon list
 * with the group labels faded out, so a fly-out here would invent an
 * interaction the chrome doesn't otherwise have, and it would be the only nav
 * row that needs two clicks.
 */
export function NavSection({
	item,
	pathname,
	collapsed = false,
	size = 'compact',
	onNavigate,
}: NavSectionProps) {
	const t = useT('nav');
	const { Icon } = item;
	const subItems = item.items ?? [];
	const label = t(`item.${item.label}`);

	// The parent path redirects into the section, so it counts as being inside it.
	const sectionActive =
		pathname === item.href || subItems.some((sub) => pathname === sub.href);

	const [open, setOpen] = useState(sectionActive);

	const [wasSectionActive, setWasSectionActive] = useState(sectionActive);
	if (sectionActive !== wasSectionActive) {
		setWasSectionActive(sectionActive);
		if (sectionActive) setOpen(true);
	}

	if (collapsed) {
		return (
			<>
				{subItems.map((sub) => (
					<NavButton
						key={sub.id}
						item={sub}
						active={pathname === sub.href}
						collapsed
						size={size}
						onNavigate={onNavigate}
					/>
				))}
			</>
		);
	}

	return (
		<div className="flex flex-col gap-0.5">
			<button
				type="button"
				onClick={() => setOpen((o) => !o)}
				aria-expanded={open}
				className={cn(
					'flex w-full items-center overflow-hidden rounded-md transition-colors',
					size === 'touch' ? 'h-11 text-sm' : 'h-9 text-[13px]',
					// A section is never "the current page" — a child is. It only
					// reads as current-ish while folded, where nothing else can.
					sectionActive && !open
						? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
						: 'text-muted-foreground hover:bg-muted hover:text-foreground',
				)}
			>
				<span
					className={cn(
						'flex shrink-0 items-center justify-center',
						size === 'touch' ? 'w-11' : 'w-9',
					)}
				>
					<Icon
						className={cn(
							'size-4 shrink-0',
							sectionActive
								? 'text-sidebar-primary'
								: 'text-muted-foreground',
						)}
					/>
				</span>

				<span className="flex flex-1 items-center gap-1.5 overflow-hidden whitespace-nowrap pr-2.5">
					<span className="flex-1 truncate text-left">{label}</span>
					<ChevronRight
						className={cn(
							'size-3.5 shrink-0 text-muted-foreground transition-transform duration-220 ease-in-out',
							open && 'rotate-90',
						)}
					/>
				</span>
			</button>

			{/* `grid-rows-[0fr→1fr]` animates to the children's natural height —
			    no max-height guess that a fourth destination would silently clip. */}
			<div
				className={cn(
					'grid transition-[grid-template-rows] duration-220 ease-in-out',
					open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
				)}
			>
				<div className="overflow-hidden">
					<div
						className={cn(
							'flex flex-col gap-0.5 border-l border-sidebar-border pt-0.5',
							// Lines the guide up with the parent icon's centre.
							size === 'touch' ? 'ml-5.5 pl-1.5' : 'ml-4.5 pl-1.5',
						)}
					>
						{subItems.map((sub) => (
							<NavButton
								key={sub.id}
								item={sub}
								active={pathname === sub.href}
								size={size}
								nested
								onNavigate={onNavigate}
							/>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
