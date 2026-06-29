import { useState } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import {
	Activity,
	Building2,
	ChevronLeft,
	ChevronRight,
	CreditCard,
	LayoutDashboard,
	ScrollText,
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

const PLATFORM_ITEMS: NavItemDef[] = [
	{ id: 'dashboard', label: 'Dashboard', Icon: LayoutDashboard, href: '/', match: '/' },
	{ id: 'tenants', label: 'Tenants', Icon: Building2, href: '/tenants', match: '/tenants' },
	// TODO: href → '/plans' once route exists
	{ id: 'plans', label: 'Plans', Icon: CreditCard, href: '/', match: '/plans' },
];

const SYSTEM_ITEMS: NavItemDef[] = [
	// TODO: href → '/users' once route exists
	{ id: 'users', label: 'Users', Icon: Users, href: '/', match: '/users' },
	// TODO: href → '/roles' once route exists
	{ id: 'roles', label: 'Roles', Icon: Shield, href: '/', match: '/roles' },
	// TODO: href → '/audit-log' once route exists
	{
		id: 'audit-log',
		label: 'Audit Log',
		Icon: ScrollText,
		href: '/',
		match: '/audit-log',
	},
];

const BOTTOM_ITEMS: NavItemDef[] = [
	// TODO: href → '/health' once route exists
	{ id: 'health', label: 'System Health', Icon: Activity, href: '/', match: '/health' },
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
					label="Platform"
					items={PLATFORM_ITEMS}
					collapsed={collapsed}
					pathname={pathname}
				/>
				<NavGroup
					label="System"
					items={SYSTEM_ITEMS}
					collapsed={collapsed}
					pathname={pathname}
				/>

				<div className="mt-auto flex flex-col gap-0.5">
					<Separator className="mb-3 bg-(--console-line)" />
					{BOTTOM_ITEMS.map((item) => (
						<NavItem
							key={item.id}
							item={item}
							collapsed={collapsed}
							pathname={pathname}
						/>
					))}
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
