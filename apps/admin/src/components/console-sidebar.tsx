import { useState } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import {
	Building2,
	ChevronLeft,
	ChevronRight,
	CreditCard,
	LayoutDashboard,
	Receipt,
	ScrollText,
	Settings,
	Shield,
	Users,
} from 'lucide-react';
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
		label: 'Platform Dashboard',
		Icon: LayoutDashboard,
		href: '/',
		match: '/',
	},
];

const CUSTOMERS_ITEMS: NavItemDef[] = [
	{
		id: 'tenants',
		label: 'Tenants',
		Icon: Building2,
		href: '/tenants',
		match: '/tenants',
	},
	{
		id: 'users',
		label: 'User Directory',
		Icon: Users,
		href: '/users',
		match: '/users',
	},
];

const REVENUE_ITEMS: NavItemDef[] = [
	{
		id: 'subscription-plans',
		label: 'Subscription Plans',
		Icon: CreditCard,
		href: '/subscription-plans',
		match: '/subscription-plans',
	},
	{
		id: 'subscriptions',
		label: 'Subscriptions',
		Icon: Receipt,
		href: '/subscriptions',
		match: '/subscriptions',
	},
];

const PLATFORM_ITEMS: NavItemDef[] = [
	// TODO: href → '/roles' once route exists
	{
		id: 'roles',
		label: 'Role Templates',
		Icon: Shield,
		href: '/',
		match: '/roles',
	},
	{
		id: 'audit-log',
		label: 'Audit Log',
		Icon: ScrollText,
		href: '/audit-log',
		match: '/audit-log',
	},
	// TODO: href → '/settings' once route exists
	{
		id: 'settings',
		label: 'Settings',
		Icon: Settings,
		href: '/',
		match: '/settings',
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
					? 'bg-(--console-accent) font-medium text-(--console-accent-fg)'
					: 'text-(--console-muted-fg) hover:bg-white/5 hover:text-(--console-fg)',
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
				<div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-(--console-muted-fg)">
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

export function ConsoleSidebar() {
	const [collapsed, setCollapsed] = useState(false);
	const pathname = useRouterState({ select: (s) => s.location.pathname });

	return (
		<aside
			className={cn(
				'flex shrink-0 flex-col border-r border-(--console-line) bg-(--console) transition-[width] duration-200',
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
				<NavGroup
					label="Customers"
					items={CUSTOMERS_ITEMS}
					collapsed={collapsed}
					pathname={pathname}
				/>
				<NavGroup
					label="Revenue"
					items={REVENUE_ITEMS}
					collapsed={collapsed}
					pathname={pathname}
				/>
				<div className="mt-auto flex flex-col gap-4">
					<Separator className="bg-(--console-line)" />
					<NavGroup
						label="Platform"
						items={PLATFORM_ITEMS}
						collapsed={collapsed}
						pathname={pathname}
					/>
				</div>
			</nav>

			{/* Toggle */}
			<div className="shrink-0 border-t border-(--console-line) p-3">
				<button
					type="button"
					onClick={() => setCollapsed((c) => !c)}
					aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
					className={cn(
						'flex h-9 w-full items-center rounded-md text-sm text-(--console-muted-fg) transition-colors hover:bg-white/5 hover:text-(--console-fg)',
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
