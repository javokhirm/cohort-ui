import type { ReactNode } from 'react';
import { LogOut, ShieldCheck } from 'lucide-react';

import { Button } from '@repo/ui';
import { useAuth } from '@/features/auth/hooks';

/** Dark "console" chrome for the authenticated admin area: a topbar + content. */
export function ConsoleShell({ children }: { children: ReactNode }) {
	const { user, logout } = useAuth();
	const fullName = user ? `${user.firstName} ${user.lastName}`.trim() : '';

	return (
		<div className="flex min-h-svh flex-col bg-background text-foreground">
			<header className="sticky top-0 z-20 flex h-14 items-center justify-between border-b border-border bg-card/80 px-6 backdrop-blur">
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
					{fullName && (
						<span className="hidden text-sm text-muted-foreground sm:inline">{fullName}</span>
					)}
					<Button variant="ghost" size="sm" onClick={logout}>
						<LogOut className="size-4" />
						Sign out
					</Button>
				</div>
			</header>
			<main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">{children}</main>
		</div>
	);
}
