import { useState } from 'react';
import { Check, ChevronDown, Globe, PanelLeft, Search, Sun } from 'lucide-react';

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	NotificationBell,
} from '@repo/ui';

interface HeaderProps {
	sidebarCollapsed: boolean;
	onSidebarToggle: () => void;
}

const BRANCHES = [
	{ id: 'all', name: 'All branches', color: '#64748b' },
	{ id: '1', name: 'Yunusobod', color: '#6366f1' },
	{ id: '2', name: 'Chilonzor', color: '#0e7490' },
	{ id: '3', name: 'Sergeli', color: '#7c3aed' },
];

export function Header({ sidebarCollapsed, onSidebarToggle }: HeaderProps) {
	const [activeBranch, setActiveBranch] = useState(BRANCHES[1]);

	return (
		<header className="z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-3">
			{/* Sidebar toggle */}
			<button
				type="button"
				onClick={onSidebarToggle}
				aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
				className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
			>
				<PanelLeft className="size-4" />
			</button>

			{/* Branch switcher */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-sm hover:bg-muted"
					>
						<span
							className="size-2 rounded-full"
							style={{ background: activeBranch?.color }}
						/>
						<span className="font-medium text-foreground">
							{activeBranch?.name}
						</span>
						<ChevronDown className="size-3.5 text-muted-foreground" />
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="start" className="w-52">
					<DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
						Switch Branch
					</DropdownMenuLabel>
					{BRANCHES.map((branch) => (
						<DropdownMenuItem
							key={branch.id}
							onClick={() => setActiveBranch(branch)}
							className="gap-2"
						>
							<span
								className="size-2 rounded-full"
								style={{ background: branch.color }}
							/>
							<span className="flex-1">{branch.name}</span>
							{activeBranch?.id === branch.id && (
								<Check className="size-3.5 text-primary" />
							)}
						</DropdownMenuItem>
					))}
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Search */}
			<div className="relative flex h-8 max-w-xs flex-1 items-center">
				<Search className="absolute left-2.5 size-3.5 text-muted-foreground" />
				<input
					type="search"
					placeholder="Search students, invoices, groups..."
					className="h-full w-full rounded-lg border border-border bg-muted/50 pl-8 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
				/>
				<kbd className="pointer-events-none absolute right-2 flex h-5 items-center rounded border border-border bg-background px-1 text-[10px] font-medium text-muted-foreground">
					⌘K
				</kbd>
			</div>

			<div className="flex-1" />

			{/* Language picker */}
			<DropdownMenu>
				<DropdownMenuTrigger asChild>
					<button
						type="button"
						className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 hover:bg-muted"
					>
						<Globe className="size-4 text-muted-foreground" />
						<span className="text-xs font-semibold text-foreground">EN</span>
					</button>
				</DropdownMenuTrigger>
				<DropdownMenuContent align="end" className="w-44">
					<DropdownMenuItem className="justify-between">
						English <Check className="size-3.5 text-primary" />
					</DropdownMenuItem>
					<DropdownMenuItem>Русский</DropdownMenuItem>
					<DropdownMenuItem>O'zbekcha</DropdownMenuItem>
					<DropdownMenuSeparator />
					<p className="px-2 py-1 text-[10px] text-muted-foreground">
						UI copy stays English in preview
					</p>
				</DropdownMenuContent>
			</DropdownMenu>

			{/* Notifications */}
			<NotificationBell unreadCount={0} />

			{/* Theme toggle */}
			<button
				type="button"
				aria-label="Toggle theme"
				className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted"
			>
				<Sun className="size-4" />
			</button>
		</header>
	);
}
