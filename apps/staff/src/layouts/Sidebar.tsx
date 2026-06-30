import { useState } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, LayoutDashboard } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn, Separator, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';

type NavItemDef = {
	id: string;
	label: string;
	Icon: LucideIcon;
	href: string;
	match: string;
};

const OVERVIEW_ITEMS: NavItemDef[] = [
	{
		id: 'dashboard',
		label: 'Dashboard',
		Icon: LayoutDashboard,
		href: '/',
		match: '/',
	},
];

function NavItemLink({
	item,
	collapsed,
	active,
}: {
	item: NavItemDef;
	collapsed: boolean;
	active: boolean;
}) {
	const { Icon } = item;
	return (
		<Link
			to={item.href}
			className={cn(
				'flex h-9 w-full items-center rounded-md text-sm transition-colors',
				collapsed ? 'justify-center' : 'gap-3 px-3',
				active
					? 'bg-primary/10 font-medium text-primary'
					: 'text-muted-foreground hover:bg-muted hover:text-foreground',
			)}
		>
			<Icon className="size-4 shrink-0" />
			{!collapsed && <span className="truncate">{item.label}</span>}
		</Link>
	);
}

function NavItem({
	item,
	collapsed,
	pathname,
}: {
	item: NavItemDef;
	collapsed: boolean;
	pathname: string;
}) {
	const active = pathname === item.match;

	if (collapsed) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<NavItemLink item={item} collapsed={collapsed} active={active} />
				</TooltipTrigger>
				<TooltipContent side="right" sideOffset={8}>
					{item.label}
				</TooltipContent>
			</Tooltip>
		);
	}

	return <NavItemLink item={item} collapsed={collapsed} active={active} />;
}

function NavGroup({
	label,
	items,
	collapsed,
	pathname,
}: {
	label: string;
	items: NavItemDef[];
	collapsed: boolean;
	pathname: string;
}) {
	return (
		<div className="flex flex-col gap-0.5">
			{!collapsed && (
				<div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
					{label}
				</div>
			)}
			{items.map((item) => (
				<NavItem
					key={item.id}
					item={item}
					collapsed={collapsed}
					pathname={pathname}
				/>
			))}
		</div>
	);
}

export function Sidebar() {
	const [collapsed, setCollapsed] = useState(false);
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	return (
		<aside
			className={cn(
				'flex shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200',
				collapsed ? 'w-14' : 'w-60',
			)}
		>
			<nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
				<NavGroup
					label="Overview"
					items={OVERVIEW_ITEMS}
					collapsed={collapsed}
					pathname={pathname}
				/>
				<div className="mt-auto">
					<Separator className="mb-4" />
				</div>
			</nav>

			<div className="shrink-0 border-t border-border p-3">
				<button
					type="button"
					onClick={() => setCollapsed((c) => !c)}
					aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
					className={cn(
						'flex h-9 w-full items-center rounded-md text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground',
						collapsed ? 'justify-center' : 'gap-2 px-3',
					)}
				>
					{collapsed ? (
						<ChevronRight className="size-4 shrink-0" />
					) : (
						<>
							<ChevronLeft className="size-4 shrink-0" />
							<span>Collapse</span>
						</>
					)}
				</button>
			</div>
		</aside>
	);
}
