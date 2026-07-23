import { PanelLeft, Search } from 'lucide-react';

import { NotificationBell, ThemeToggle } from '@repo/ui';
import { useT } from '@repo/i18n';

import { BranchSelector } from './BranchSelector';
import { LanguageMenu } from './LanguageMenu';

interface HeaderProps {
	sidebarCollapsed: boolean;
	onSidebarToggle: () => void;
}

export function Header({ sidebarCollapsed, onSidebarToggle }: HeaderProps) {
	const t = useT('nav');
	return (
		<header className="z-40 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-card px-3">
			{/* Sidebar toggle */}
			<button
				type="button"
				onClick={onSidebarToggle}
				aria-label={
					sidebarCollapsed
						? t('shell.expandSidebar')
						: t('shell.collapseSidebar')
				}
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
					placeholder={t('shell.searchPlaceholder')}
					className="h-full w-full rounded-lg border border-border bg-muted/50 pl-8 pr-10 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
				/>
				<kbd className="pointer-events-none absolute right-2 flex h-5 items-center rounded border border-border bg-background px-1 text-[10px] font-medium text-muted-foreground">
					⌘K
				</kbd>
			</div>

			<div className="flex-1" />

			{/* Language picker */}
			<LanguageMenu />

			{/* Notifications */}
			<NotificationBell unreadCount={0} />

			{/* Theme toggle */}
			<ThemeToggle className="size-8 rounded-lg" />
		</header>
	);
}
