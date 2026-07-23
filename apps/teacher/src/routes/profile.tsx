import { IdCard, LogOut, Mail, MapPin, Moon, Phone, Sun, UserRound } from 'lucide-react';

import {
	Avatar,
	AvatarFallback,
	AvatarImage,
	Button,
	DetailRows,
	EmptyState,
	Skeleton,
	StatusBadge,
	useTheme,
} from '@repo/ui';

import { useTeachBranches } from '@/api/branches';
import { useAuth } from '@/features/auth/hooks';
import { useProfile } from '@/features/profile/api/profile.queries';
import { useAppT } from '@/locales';

/**
 * The signed-in teacher's profile (`GET /teach/me`, api-reference §4.9).
 *
 * The login/refresh `user` summary carries only `id`, name, `roles` and
 * `branchScope`; the contact fields this screen shows (`phone`, `email`,
 * `avatarUrl`) come from `/teach/me`, fetched here rather than widening the
 * shared auth response. Branch names are resolved from `/teach/branches` — the
 * app's canonical branch-labeling source — since the profile carries only ids.
 *
 * Mobile-first: a single centered column that a teacher reads on a phone.
 */
export function ProfileRoute() {
	const t = useAppT('profile');
	const tShell = useAppT('shell');
	const { logout } = useAuth();
	const { isDark, toggleTheme } = useTheme();
	const { data: profile, isPending, isError } = useProfile();
	const branchesQuery = useTeachBranches();

	if (isPending) {
		return (
			<div className="mx-auto w-full max-w-2xl space-y-4">
				<Skeleton className="h-22.5 w-full rounded-2xl" />
				<Skeleton className="h-49 w-full rounded-2xl" />
				<Skeleton className="h-14 w-full rounded-2xl" />
			</div>
		);
	}

	if (isError || !profile) {
		return (
			<div className="mx-auto w-full max-w-2xl">
				<div className="rounded-2xl border border-border bg-card">
					<EmptyState
						icon={<UserRound />}
						title={t('errorTitle')}
						description={t('errorDescription')}
					/>
				</div>
				<Button
					variant="outline"
					className="mt-4 w-full text-destructive"
					onClick={logout}
				>
					<LogOut className="size-4" />
					{tShell('logOut')}
				</Button>
			</div>
		);
	}

	const fullName = `${profile.firstName} ${profile.lastName}`.trim();
	const initials =
		`${profile.firstName?.[0] ?? ''}${profile.lastName?.[0] ?? ''}`.toUpperCase();

	const branchesValue =
		profile.branchScope === null ? (
			'All branches'
		) : branchesQuery.isPending ? (
			<Skeleton className="h-4 w-32" />
		) : branchesQuery.data && branchesQuery.data.length > 0 ? (
			branchesQuery.data.map((branch) => branch.name).join(' · ')
		) : (
			'—'
		);

	return (
		<div className="mx-auto w-full max-w-2xl">
			{/* Identity header */}
			<div className="flex items-center gap-3.5 rounded-2xl border border-border bg-card p-4 shadow-xs">
				<Avatar className="size-14 rounded-2xl">
					<AvatarImage src={profile.avatarUrl ?? undefined} alt={fullName} />
					<AvatarFallback className="rounded-2xl text-lg">
						{initials}
					</AvatarFallback>
				</Avatar>
				<div className="min-w-0">
					<p className="truncate text-[17px] font-bold tracking-tight text-foreground">
						{fullName}
					</p>
					<div className="mt-1">
						<StatusBadge kind="role" status="teacher" />
					</div>
				</div>
			</div>

			{/* Contact & identity fields */}
			<div className="mt-4 rounded-2xl border border-border bg-card px-4 shadow-xs">
				<DetailRows
					rows={[
						{
							label: 'Staff ID',
							value: String(profile.id),
							icon: <IdCard />,
						},
						{ label: 'Phone', value: profile.phone, icon: <Phone /> },
						{ label: 'Email', value: profile.email ?? '—', icon: <Mail /> },
						{ label: 'Branches', value: branchesValue, icon: <MapPin /> },
					]}
				/>
			</div>

			{/* Settings */}
			<p className="mt-6 mb-2 px-1 text-[10.5px] font-semibold uppercase tracking-widest text-muted-foreground">
				{tShell('settings')}
			</p>
			<div className="overflow-hidden rounded-2xl border border-border bg-card shadow-xs">
				<Button
					variant="ghost"
					onClick={toggleTheme}
					className="h-auto w-full justify-start gap-3 rounded-none px-4 py-3.5 font-medium"
				>
					{isDark ? (
						<Moon className="size-4.5 text-muted-foreground" />
					) : (
						<Sun className="size-4.5 text-muted-foreground" />
					)}
					<span className="flex-1 text-left text-foreground">Appearance</span>
					<span className="text-[13px] font-normal text-muted-foreground">
						{isDark ? 'Dark' : 'Light'} mode
					</span>
				</Button>
			</div>

			<Button
				variant="outline"
				className="mt-4 w-full text-destructive"
				onClick={logout}
			>
				<LogOut className="size-4" />
				{tShell('logOut')}
			</Button>
		</div>
	);
}
