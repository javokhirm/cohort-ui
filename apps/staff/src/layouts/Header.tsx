import { Check, Globe, PanelLeft, Search, Sun } from 'lucide-react';

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
	NotificationBell,
} from '@repo/ui';

import { BranchSelector } from './BranchSelector';

interface HeaderProps {
	sidebarCollapsed: boolean;
	onSidebarToggle: () => void;
}

export function Header({ sidebarCollapsed, onSidebarToggle }: HeaderProps) {
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

			{/* Global branch selector (multi-select; hidden for single-branch users) */}
			<BranchSelector />

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
