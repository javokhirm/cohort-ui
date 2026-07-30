import { LogOut, UserRound } from 'lucide-react';

import { Button, EmptyState, Skeleton } from '@repo/ui';

import { useAuth } from '@/features/auth/hooks';
import { useMe } from '@/features/profile/api/profile.queries';
import { ContactCard } from '@/features/profile/components/ContactCard';
import { LanguageSelect } from '@/features/profile/components/LanguageSelect';
import { PreferencesCard } from '@/features/profile/components/PreferencesCard';
import { ProfileHeader } from '@/features/profile/components/ProfileHeader';
import { SectionLabel } from '@/features/profile/components/SectionLabel';
import { useAppT } from '@/locales';

/**
 * The signed-in student's profile (`GET /student/me`, api-reference §5.1).
 *
 * Reached from the app bar's avatar and the sidebar footer rather than a tab. This is the
 * app's only read of `/student/me`: the login/refresh `user` summary carries just the name
 * and roles, while the contact fields, student code and branch this screen shows live on
 * the profile endpoint. Sign-out stays reachable even when the fetch fails — on a phone
 * this screen is the only place it exists.
 */
export function ProfileRoute() {
	const t = useAppT('profile');
	const { logout } = useAuth();
	const { data: me, isPending, isError, refetch } = useMe();

	const logoutButton = (
		<Button
			variant="outline"
			onClick={logout}
			className="h-12 w-full rounded-[13px] text-[14.5px] font-semibold text-destructive hover:border-destructive hover:text-destructive"
		>
			<LogOut className="size-4" />
			{t('logOut')}
		</Button>
	);

	if (isPending) {
		return (
			<div className="mx-auto w-full max-w-160 pb-8">
				<div className="mb-4.5 flex flex-col items-center gap-2.5">
					<Skeleton className="size-18.5 rounded-[22px]" />
					<Skeleton className="h-5 w-40" />
					<Skeleton className="h-3.5 w-24" />
				</div>
				<Skeleton className="mb-4.5 h-38 w-full rounded-[15px]" />
				<Skeleton className="mb-6 h-11.5 w-full rounded-xl" />
				<Skeleton className="mb-4.5 h-29 w-full rounded-[15px]" />
				{logoutButton}
			</div>
		);
	}

	if (isError || !me) {
		return (
			<div className="mx-auto w-full max-w-160 pb-8">
				<div className="mb-4.5 rounded-[15px] border border-border bg-card">
					<EmptyState
						icon={<UserRound />}
						title={t('errorTitle')}
						description={t('errorDescription')}
						action={
							<Button variant="outline" onClick={() => void refetch()}>
								{t('retry')}
							</Button>
						}
					/>
				</div>
				{logoutButton}
			</div>
		);
	}

	const fullName = `${me.firstName} ${me.lastName}`.trim();
	const initials = `${me.firstName?.[0] ?? ''}${me.lastName?.[0] ?? ''}`.toUpperCase();

	return (
		<div className="mx-auto w-full max-w-160 pb-8">
			<ProfileHeader
				fullName={fullName}
				initials={initials}
				avatarUrl={me.avatarUrl}
				studentCode={me.studentCode}
			/>

			<SectionLabel>{t('contact')}</SectionLabel>
			<ContactCard phone={me.phone} email={me.email} />

			<SectionLabel>{t('preferredLanguage')}</SectionLabel>
			<div className="mb-6">
				<LanguageSelect />
			</div>

			<SectionLabel className="mt-7">{t('preferences')}</SectionLabel>
			<PreferencesCard contactPhone={me.branch.phone ?? me.center.phone} />

			{logoutButton}
		</div>
	);
}
