import { LogOut } from 'lucide-react';

import { Button, DetailRows, StatusBadge } from '@repo/ui';

import { useAuth } from '@/features/auth/hooks';

/**
 * The signed-in teacher, straight from the session. There is no `/teach/me`
 * endpoint — the login/refresh `user` summary is the only profile the client
 * ever sees, so this screen is complete rather than a placeholder.
 */
export function ProfileRoute() {
	const { user, logout } = useAuth();

	if (!user) return null;

	const fullName = `${user.firstName} ${user.lastName}`.trim();
	const initials =
		`${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase();

	return (
		<div className="mx-auto w-full max-w-2xl">
			<div className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4">
				<div className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-tone-indigo-bg text-lg font-semibold text-tone-indigo-fg">
					{initials}
				</div>
				<div className="min-w-0">
					<p className="truncate text-[17px] font-bold tracking-tight text-foreground">
						{fullName}
					</p>
					<div className="mt-1">
						<StatusBadge kind="role" status="teacher" />
					</div>
				</div>
			</div>

			<div className="mt-4 rounded-2xl border border-border bg-card p-4">
				<DetailRows
					rows={[
						{ label: 'Staff ID', value: String(user.id) },
						{
							label: 'Branches',
							value:
								user.branchScope === null
									? 'All branches'
									: `${user.branchScope.length} assigned`,
						},
						{ label: 'Roles', value: user.roles.join(' · ') },
					]}
				/>
			</div>

			<Button
				variant="outline"
				className="mt-4 w-full text-destructive"
				onClick={logout}
			>
				<LogOut className="size-4" />
				Log out
			</Button>
		</div>
	);
}
