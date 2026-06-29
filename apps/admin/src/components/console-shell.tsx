import type { ReactNode } from 'react';
import { LogOut, Search, ShieldCheck } from 'lucide-react';

import { Button } from '@repo/ui';
import { useAuth } from '@/features/auth/hooks';
import { ConsoleSidebar } from './console-sidebar';

/** Dark "console" chrome for the authenticated admin area: sidebar + topbar + content. */
export function ConsoleShell({ children }: { children: ReactNode }) {
	const { user, logout } = useAuth();
	const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';

	return (
		<div className="flex min-h-svh bg-background text-foreground">
			<ConsoleSidebar />

			<div className="flex min-w-0 flex-1 flex-col">
				<header className="sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between border-b border-(--console-line) bg-(--console) px-6">
					<div className="flex items-center gap-2">
						<span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
							<ShieldCheck className="size-4" />
						</span>
						<div className="flex flex-col leading-tight">
							<span className="text-sm font-semibold">EduCore</span>
							<span className="text-[11px] uppercase tracking-wider text-muted-foreground">
								Admin Console
							</span>
						</div>
					</div>

					<div className="flex items-center gap-3">
						{/* ⌘K global search trigger — no functionality yet */}
						<Button
							variant="outline"
							size="sm"
							className="gap-2 text-muted-foreground"
							aria-label="Open search"
						>
							<Search className="size-3.5" />
							<span className="hidden sm:inline text-sm">Search</span>
							<kbd className="hidden rounded border border-border bg-muted px-1 text-[10px] sm:inline-block">
								⌘K
							</kbd>
						</Button>

						{fullName && (
							<span className="hidden text-sm text-muted-foreground sm:inline">
								{fullName}
							</span>
						)}

						<Button variant="ghost" size="sm" onClick={logout}>
							<LogOut className="size-4" />
							Sign out
						</Button>
					</div>
				</header>

				<main className="flex-1 px-6 py-8">{children}</main>
			</div>
		</div>
	);
}
