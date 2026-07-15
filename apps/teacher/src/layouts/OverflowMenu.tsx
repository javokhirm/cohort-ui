import { LogOut, MoreHorizontal } from 'lucide-react';

import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@repo/ui';

import { useAuth } from '@/features/auth/hooks';

/** Topbar overflow menu. Appearance lives in the topbar's `ThemeToggle` icon. */
export function OverflowMenu() {
	const { logout } = useAuth();

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
