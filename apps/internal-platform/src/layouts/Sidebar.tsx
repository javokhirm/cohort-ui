import { useState } from 'react';
import { Link, useRouterState } from '@tanstack/react-router';
import {
	Building2,
	ChevronLeft,
	ChevronRight,
	CreditCard,
	FileText,
	LayoutDashboard,
	Receipt,
	ScrollText,
	Settings,
	Shield,
	Users,
	Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { cn, Separator, Tooltip, TooltipContent, TooltipTrigger } from '@repo/ui';
import { useT } from '@repo/i18n';

/** Leaf key under `nav:item.*` — resolved with `t()` at render (typed, not `string`). */
type NavItemKey =
	| 'platformDashboard'
	| 'tenants'
	| 'userDirectory'
	| 'subscriptionPlans'
	| 'subscriptions'
	| 'payments'
	| 'invoices'
	| 'roleTemplates'
	| 'auditLog'
	| 'settings';
/** Leaf key under `nav:group.*`. */
type NavGroupKey = 'overview' | 'customers' | 'revenue' | 'platform';

type NavItemDef = {
	id: string;
	label: NavItemKey;
	Icon: LucideIcon;
	href: string;
	match: string;
};

const OVERVIEW_ITEMS: NavItemDef[] = [
	{
		id: 'dashboard',
		label: 'platformDashboard',
		Icon: LayoutDashboard,
		href: '/',
		match: '/',
	},
];

const CUSTOMERS_ITEMS: NavItemDef[] = [
	{
		id: 'tenants',
		label: 'tenants',
		Icon: Building2,
		href: '/tenants',
		match: '/tenants',
	},
	{
		id: 'users',
		label: 'userDirectory',
		Icon: Users,
		href: '/users',
		match: '/users',
	},
];

const REVENUE_ITEMS: NavItemDef[] = [
	{
		id: 'subscription-plans',
		label: 'subscriptionPlans',
		Icon: CreditCard,
		href: '/subscription-plans',
		match: '/subscription-plans',
	},
	{
		id: 'subscriptions',
		label: 'subscriptions',
		Icon: Receipt,
		href: '/subscriptions',
		match: '/subscriptions',
	},
	{
		id: 'subscription-payments',
		label: 'payments',
		Icon: Wallet,
		href: '/subscription-payments',
		match: '/subscription-payments',
	},
	{
		id: 'subscription-invoices',
		label: 'invoices',
		Icon: FileText,
		href: '/subscription-invoices',
		match: '/subscription-invoices',
	},
];

const PLATFORM_ITEMS: NavItemDef[] = [
	{
		id: 'roles',
		label: 'roleTemplates',
		Icon: Shield,
		href: '/roles',
		match: '/roles',
	},
	{
		id: 'audit-log',
		label: 'auditLog',
		Icon: ScrollText,
		href: '/audit-log',
		match: '/audit-log',
	},
	// TODO: href → '/settings' once route exists
	{
		id: 'settings',
		label: 'settings',
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
	const t = useT('nav');
	return (
		<Link
			to={item.href}
			className={cn(
				'flex h-9 w-full items-center rounded-md text-sm transition-colors',
				collapsed ? 'justify-center' : 'gap-3 px-3',
				active
					? 'bg-(--console-accent) font-medium text-(--console-accent-fg)'
					: 'text-(--console-muted-fg) hover:bg-(--console-hover) hover:text-(--console-fg)',
			)}
		>
			<Icon className="size-4 shrink-0" />
			{!collapsed && <span className="truncate">{t(`item.${item.label}`)}</span>}
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
	const t = useT('nav');

	if (collapsed) {
		return (
			<Tooltip>
				<TooltipTrigger asChild>
					<NavItemLink item={item} collapsed={collapsed} active={active} />
				</TooltipTrigger>
				<TooltipContent side="right" sideOffset={8}>
					{t(`item.${item.label}`)}
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

export function Sidebar() {
	const [collapsed, setCollapsed] = useState(false);
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const t = useT('nav');

	const groupLabel = (key: NavGroupKey) => t(`group.${key}`);

	return (
		<aside
			className={cn(
				'flex shrink-0 flex-col border-r border-(--console-line) bg-(--console) transition-[width] duration-200',
				collapsed ? 'w-14' : 'w-60',
			)}
		>
			<nav className="flex flex-1 flex-col gap-4 overflow-y-auto p-3">
				<NavGroup
					label={groupLabel('overview')}
					items={OVERVIEW_ITEMS}
					collapsed={collapsed}
					pathname={pathname}
				/>
				<NavGroup
					label={groupLabel('customers')}
					items={CUSTOMERS_ITEMS}
					collapsed={collapsed}
					pathname={pathname}
				/>
				<NavGroup
					label={groupLabel('revenue')}
					items={REVENUE_ITEMS}
					collapsed={collapsed}
					pathname={pathname}
				/>
				<div className="mt-auto flex flex-col gap-4">
					<Separator className="bg-(--console-line)" />
					<NavGroup
						label={groupLabel('platform')}
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
					aria-label={
						collapsed ? t('shell.expandSidebar') : t('shell.collapseSidebar')
					}
					className={cn(
						'flex h-9 w-full items-center rounded-md text-sm text-(--console-muted-fg) transition-colors hover:bg-(--console-hover) hover:text-(--console-fg)',
						collapsed ? 'justify-center' : 'gap-2 px-3',
					)}
				>
					{collapsed ? (
						<ChevronRight className="size-4 shrink-0" />
					) : (
						<>
							<ChevronLeft className="size-4 shrink-0" />
							<span>{t('shell.collapse')}</span>
						</>
					)}
				</button>
			</div>
		</aside>
	);
}
