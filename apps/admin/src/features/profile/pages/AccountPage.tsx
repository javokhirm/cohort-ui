import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Label,
	PageHeader,
	Skeleton,
} from '@repo/ui';

import { useMyProfile } from '../api/profile.queries';
import { ChangePasswordForm } from '../components/ChangePasswordForm';
import { useAppT } from '@/locales';

/** A labelled, non-editable identity value. Name/phone/email are not editable here. */
function ReadOnlyField({ label, value }: { label: string; value: string }) {
	return (
		<div className="flex flex-col gap-1.5">
			<Label className="text-muted-foreground">{label}</Label>
			<p className="text-sm text-foreground">{value}</p>
		</div>
	);
}

export function AccountPage() {
	const t = useAppT('profile');
	const { data: profile, isLoading, isError } = useMyProfile();

	const fullName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : '';

	return (
		<div className="mx-auto flex max-w-3xl flex-col gap-6">
			<PageHeader title={t('title')} description={t('description')} />

			{isLoading && <Skeleton className="h-44 w-full rounded-xl" />}

			{isError && (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					{t('loadError')}
				</div>
			)}

			{profile && (
				<Card>
					<CardHeader>
						<CardTitle>{t('profileCardTitle')}</CardTitle>
						<CardDescription>{t('identityHint')}</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<ReadOnlyField
								label={t('fullName')}
								value={fullName || '—'}
							/>
							<ReadOnlyField label={t('phone')} value={profile.phone} />
							<ReadOnlyField
								label={t('email')}
								value={profile.email ?? '—'}
							/>
							<ReadOnlyField
								label={t('role')}
								value={profile.roles.join(', ') || '—'}
							/>
						</div>
					</CardContent>
				</Card>
			)}

			{/* Independent of the profile query — changing your password does not need it. */}
			<ChangePasswordForm />
		</div>
	);
}
