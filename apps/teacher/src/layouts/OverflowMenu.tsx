import { LogOut, Moon, MoreHorizontal, Sun } from 'lucide-react';

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@repo/ui';

import { useAuth } from '@/features/auth/hooks';
import { useThemeStore } from '@/lib/theme';

/** Topbar overflow menu: appearance toggle + sign out. */
export function OverflowMenu() {
	const { logout } = useAuth();
	const theme = useThemeStore((s) => s.theme);
	const toggleTheme = useThemeStore((s) => s.toggleTheme);

	const isDark = theme === 'dark';

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					aria-label="More options"
					className="flex size-9 shrink-0 items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-muted"
				>
					<MoreHorizontal className="size-[19px]" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="w-56">
				<DropdownMenuItem onClick={toggleTheme}>
					{isDark ? (
						<Sun className="mr-2 size-4" />
					) : (
						<Moon className="mr-2 size-4" />
					)}
					Switch to {isDark ? 'light' : 'dark'} theme
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					className="text-destructive focus:text-destructive"
					onClick={logout}
				>
					<LogOut className="mr-2 size-4" />
					Log out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
