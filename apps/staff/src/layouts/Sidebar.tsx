import { useNavigate, useRouterState } from '@tanstack/react-router';
import {
	BookOpen,
	Briefcase,
	Building2,
	CalendarClock,
	CalendarDays,
	CheckSquare,
	ClipboardList,
	CreditCard,
	DoorOpen,
	FileText,
	Filter,
	FolderOpen,
	GraduationCap,
	History,
	LayoutDashboard,
	Layers,
	LogOut,
	MessageSquare,
	MoreHorizontal,
	Receipt,
	ScrollText,
	Shield,
	Tag,
	User,
	Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import {
	cn,
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@repo/ui';
import { useAuth, usePermissions } from '@/features/auth/hooks';
import type { PermissionRequirement } from '@/lib/auth/permissions';
import { getTenantSlug } from '@/lib/tenant';

type NavItemDef = {
	id: string;
	label: string;
	Icon: LucideIcon;
	href: string;
	badge?: string;
	/** Permission(s) that reveal this item — any-of. Mirrors the route guard. */
	permission: PermissionRequirement;
};

type NavGroupDef = {
	label: string;
	items: NavItemDef[];
};

const NAV_GROUPS: NavGroupDef[] = [
	{
		label: 'Overview',
		items: [
			{
				id: 'dashboard',
				label: 'Dashboard',
				Icon: LayoutDashboard,
				href: '/',
				permission: 'dashboard.read',
			},
		],
	},
	{
		label: 'CRM',
		items: [
			{
				id: 'leads',
				label: 'Leads / Pipeline',
				Icon: Filter,
				href: '/leads',
				permission: 'lead.read',
			},
		],
	},
	{
		label: 'People',
		items: [
			{
				id: 'students',
				label: 'Students',
				Icon: GraduationCap,
				href: '/students',
				permission: 'student.read',
			},
			{
				id: 'staff',
				label: 'Staff & HR',
				Icon: Briefcase,
				href: '/staff',
				permission: 'staff.read',
			},
		],
	},
	{
		label: 'Academics',
		items: [
			{
				id: 'courses',
				label: 'Courses',
				Icon: BookOpen,
				href: '/courses',
				permission: 'course.read',
			},
			{
				id: 'rooms',
				label: 'Rooms',
				Icon: DoorOpen,
				href: '/rooms',
				permission: 'room.read',
			},
			{
				id: 'groups',
				label: 'Groups',
				Icon: CalendarDays,
				href: '/groups',
				permission: 'group.read',
			},
			{
				id: 'schedule',
				label: 'Schedule',
				Icon: CalendarClock,
				href: '/schedule',
				permission: 'session.read',
			},
			{
				id: 'attendance',
				label: 'Attendance',
				Icon: CheckSquare,
				href: '/attendance',
				permission: 'attendance.read',
			},
			{
				id: 'assessments',
				label: 'Assessments',
				Icon: ClipboardList,
				href: '/assessments',
				permission: 'assessment.read',
			},
			{
				id: 'report-cards',
				label: 'Report Cards',
				Icon: ScrollText,
				href: '/report-cards',
				permission: ['report-card.generate', 'report-card.publish'],
			},
		],
	},
	{
		label: 'Finance',
		items: [
			{
				id: 'invoices',
				label: 'Invoices',
				Icon: FileText,
				href: '/invoices',
				permission: 'invoice.read',
			},
			{
				id: 'payments',
				label: 'Payments',
				Icon: CreditCard,
				href: '/payments',
				permission: 'payment.read',
			},
			{
				id: 'fee-plans',
				label: 'Fee Plans',
				Icon: Layers,
				href: '/fee-plans',
				permission: 'fee-plan.manage',
			},
			{
				id: 'discounts',
				label: 'Discounts',
				Icon: Tag,
				href: '/discounts',
				permission: 'discount.manage',
			},
			{
				id: 'expenses',
				label: 'Expenses',
				Icon: Receipt,
				href: '/expenses',
				permission: [
					'expense.read',
					'expense.create',
					'expense.update',
					'expense.delete',
				],
			},
			{
				id: 'payroll',
				label: 'Payroll',
				Icon: Wallet,
				href: '/payroll',
				badge: 'OWNER',
				permission: 'payroll.read',
			},
		],
	},
	{
		label: 'Engagement',
		items: [
			{
				id: 'communication',
				label: 'Communication',
				Icon: MessageSquare,
				href: '/communication',
				permission: [
					'notification.send',
					'notification-template.manage',
					'reminder-rule.manage',
				],
			},
			{
				id: 'materials',
				label: 'Learning Materials',
				Icon: FolderOpen,
				href: '/materials',
				permission: 'material.read',
			},
		],
	},
	{
		label: 'Administration',
		items: [
			{
				id: 'branches',
				label: 'Branches',
				Icon: Building2,
				href: '/branches',
				permission: 'branch.read',
			},
			{
				id: 'roles',
				label: 'Roles & Permissions',
				Icon: Shield,
				href: '/roles',
				permission: 'role.read',
			},
			{
				id: 'audit-log',
				label: 'Audit Log',
				Icon: History,
				href: '/audit-log',
				permission: 'audit.read',
			},
		],
	},
];

interface SidebarProps {
	collapsed: boolean;
}

function NavButton({
	item,
	active,
	collapsed,
}: {
	item: NavItemDef;
	active: boolean;
	collapsed: boolean;
}) {
	const navigate = useNavigate();
	const { Icon } = item;

	const button = (
		<button
			type="button"
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			onClick={() => void navigate({ to: item.href as any })}
			className={cn(
				'flex h-9 w-full items-center overflow-hidden rounded-md text-[13px] transition-colors',
				active
					? 'bg-sidebar-accent font-semibold text-sidebar-accent-foreground'
					: 'text-muted-foreground hover:bg-muted hover:text-foreground',
			)}
		>
			{/* Icon slot — width transitions between centered (collapsed) and left-rail (expanded) */}
			<span
				className={cn(
					'flex shrink-0 items-center justify-center transition-[width] duration-220 ease-in-out',
					collapsed ? 'w-full' : 'w-9',
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
				<span className="flex-1 truncate text-left">{item.label}</span>
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
					<span>{item.label}</span>
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

export function Sidebar({ collapsed }: SidebarProps) {
	const { user, logout } = useAuth();
	const { can, permissionsLoaded } = usePermissions();
	const pathname = useRouterState({ select: (s) => s.location.pathname });
	const tenantSlug = getTenantSlug();

	// Cosmetic nav filtering — show only what the resolved permissions allow, and
	// drop a group once all its items are hidden. The backend enforces access.
	// Until `/manage/me` resolves, fail OPEN (show everything) to match the route
	// guards — otherwise a transient profile-load failure would leave an empty
	// sidebar over a still-navigable console.
	const visibleGroups = permissionsLoaded
		? NAV_GROUPS.map((group) => ({
				...group,
				items: group.items.filter((item) => can(item.permission)),
			})).filter((group) => group.items.length > 0)
		: NAV_GROUPS;

	const tenantName = tenantSlug
		? tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1)
		: 'EduCore';
	const tenantInitial = tenantName[0]?.toUpperCase() ?? 'E';

	const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';
	const initials = user
		? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase()
		: '?';
	const primaryRole = user?.roles[0] ?? '';

	return (
		<aside
			className={cn(
				'flex shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar',
				'transition-[width] duration-220 ease-in-out',
				collapsed ? 'w-14.5' : 'w-59',
			)}
		>
			{/* Tenant header */}
			<div className="flex h-14.5 shrink-0 items-center gap-2.5 border-b border-sidebar-border px-4">
				<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-extrabold text-primary-foreground">
					{tenantInitial}
				</div>
				<div
					style={{ transitionDelay: collapsed ? '0ms' : '80ms' }}
					className={cn(
						'min-w-0 overflow-hidden whitespace-nowrap transition-opacity duration-120',
						collapsed ? 'opacity-0' : 'opacity-100',
					)}
				>
					<div className="truncate text-[13.5px] font-bold tracking-tight text-sidebar-foreground">
						{tenantName}
					</div>
					<div className="font-mono text-[10px] text-muted-foreground">
						MANAGE
					</div>
				</div>
			</div>

			{/* Nav */}
			<nav className="flex flex-1 flex-col gap-3.5 overflow-y-auto p-2.5 py-3">
				{visibleGroups.map((group) => (
					<div key={group.label} className="flex flex-col gap-0.5">
						{/* Group label — collapses via max-height + fades */}
						<div
							style={{ transitionDelay: collapsed ? '0ms' : '80ms' }}
							className={cn(
								'overflow-hidden whitespace-nowrap px-2',
								'transition-[max-height,opacity] duration-120',
								collapsed
									? 'max-h-0 opacity-0'
									: 'mb-0.5 max-h-6 opacity-100',
							)}
						>
							<span className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
								{group.label}
							</span>
						</div>
						{group.items.map((item) => (
							<NavButton
								key={item.id}
								item={item}
								active={pathname === item.href}
								collapsed={collapsed}
							/>
						))}
					</div>
				))}
			</nav>

			{/* User footer */}
			<div className="shrink-0 border-t border-sidebar-border p-2.5">
				<div className="flex items-center gap-2.5 rounded-xl p-2">
					<Tooltip>
						<TooltipTrigger asChild>
							<div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-xs font-bold text-primary-foreground">
								{initials}
							</div>
						</TooltipTrigger>
						{collapsed && (
							<TooltipContent side="right" sideOffset={8}>
								<div className="font-semibold">{fullName}</div>
								{primaryRole && (
									<div className="text-[10px] text-muted-foreground">
										{primaryRole}
									</div>
								)}
							</TooltipContent>
						)}
					</Tooltip>

					<div
						style={{ transitionDelay: collapsed ? '0ms' : '80ms' }}
						className={cn(
							'flex min-w-0 flex-1 items-center gap-1.5 overflow-hidden whitespace-nowrap',
							'transition-opacity duration-120',
							collapsed ? 'opacity-0' : 'opacity-100',
						)}
					>
						<div className="min-w-0 flex-1">
							<div className="truncate text-[12.5px] font-semibold text-foreground">
								{fullName}
							</div>
							{primaryRole && (
								<div className="mt-0.5">
									<span className="rounded-md bg-tone-indigo-bg px-1.5 py-px text-[9.5px] font-semibold uppercase tracking-wide text-tone-indigo-fg">
										{primaryRole}
									</span>
								</div>
							)}
						</div>

						<DropdownMenu>
							<DropdownMenuTrigger asChild>
								<button
									type="button"
									className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
								>
									<MoreHorizontal className="size-4" />
								</button>
							</DropdownMenuTrigger>
							<DropdownMenuContent side="top" align="end" className="w-40">
								<DropdownMenuItem>
									<User className="mr-2 size-4" />
									Profile
								</DropdownMenuItem>
								<DropdownMenuSeparator />
								<DropdownMenuItem
									className="text-destructive focus:text-destructive"
									onClick={logout}
								>
									<LogOut className="mr-2 size-4" />
									Sign out
								</DropdownMenuItem>
							</DropdownMenuContent>
						</DropdownMenu>
					</div>
				</div>
			</div>
		</aside>
	);
}
