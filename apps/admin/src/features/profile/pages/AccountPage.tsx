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
	const { data: profile, isLoading, isError } = useMyProfile();

	const fullName = profile ? `${profile.firstName} ${profile.lastName}`.trim() : '';

	return (
		<div className="mx-auto flex max-w-3xl flex-col gap-6">
			<PageHeader
				title="My account"
				description="Your profile and sign-in password"
			/>

			{isLoading && <Skeleton className="h-44 w-full rounded-xl" />}

			{isError && (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					Failed to load your profile. Please refresh.
				</div>
			)}

			{profile && (
				<Card>
					<CardHeader>
						<CardTitle>Profile</CardTitle>
						<CardDescription>
							Ask an administrator to change your name or contact details.
						</CardDescription>
					</CardHeader>
					<CardContent>
						<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
							<ReadOnlyField label="Full name" value={fullName || '—'} />
							<ReadOnlyField label="Phone" value={profile.phone} />
							<ReadOnlyField label="Email" value={profile.email ?? '—'} />
							<ReadOnlyField
								label="Role"
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
