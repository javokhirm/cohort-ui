import { Lock, Monitor } from 'lucide-react';

import {
	Avatar,
	AvatarFallback,
	Button,
	Card,
	CardContent,
	Separator,
	StatusBadge,
} from '@repo/ui';
import { useAuth, useOperator } from '@/features/auth/hooks';
import { MOCK_SECURITY } from './_mock';

export function ProfilePage() {
	const { user } = useAuth();
	const { data: profile } = useOperator();

	const firstName = profile?.firstName ?? user?.firstName ?? '';
	const lastName = profile?.lastName ?? user?.lastName ?? '';
	const fullName = `${firstName} ${lastName}`.trim();
	const initials = `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
	const email = profile?.email ?? '—';
	const phone = profile?.phone ?? '';

	const sec = MOCK_SECURITY;

	return (
		<div className="flex max-w-2xl flex-col gap-6">
			{/* Page header */}
			<div>
				<h1 className="text-xl font-semibold tracking-tight">
					Profile &amp; Security
				</h1>
				<p className="text-sm text-muted-foreground">
					Your platform operator account.
				</p>
			</div>

			{/* Identity card */}
			<Card>
				<CardContent className="flex items-center gap-5 p-6">
					<Avatar className="size-16 shrink-0 rounded-xl">
						<AvatarFallback className="rounded-xl bg-primary text-xl font-bold text-white">
							{initials}
						</AvatarFallback>
					</Avatar>

					<div className="min-w-0 flex-1">
						<p className="text-base font-semibold">{fullName || '—'}</p>
						<p className="mt-0.5 text-sm text-muted-foreground">
							{email}
							{phone && (
								<>
									<span className="mx-2 text-border">·</span>
									{phone}
								</>
							)}
						</p>
					</div>

					<StatusBadge tone="indigo">PLATFORM OPERATOR</StatusBadge>
				</CardContent>
			</Card>

			{/* Security section */}
			<div className="flex flex-col gap-3">
				<h2 className="text-sm font-semibold">Security</h2>

				<Card className="gap-0 py-0">
					{/* 2FA row */}
					<div className="flex items-center gap-4 px-5 py-4">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-tone-green-bg">
							<Lock className="size-4.5 text-tone-green-fg" />
						</div>
						<div className="flex-1">
							<p className="text-sm font-medium">
								Two-factor authentication
							</p>
							<p className="text-xs text-muted-foreground">
								{sec.twoFactor.method}
								{sec.twoFactor.enforced && ' · enforced'}
							</p>
						</div>
						{sec.twoFactor.enabled ? (
							<StatusBadge tone="green">Enabled</StatusBadge>
						) : (
							<StatusBadge tone="red">Disabled</StatusBadge>
						)}
					</div>

					<Separator />

					{/* Sessions row */}
					<div className="flex items-center gap-4 px-5 py-4">
						<div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted">
							<Monitor className="size-4.5 text-muted-foreground" />
						</div>
						<div className="flex-1">
							<p className="text-sm font-medium">Active sessions</p>
							<p className="text-xs text-muted-foreground">
								{sec.sessions.count} device
								{sec.sessions.count !== 1 && 's'} ·{' '}
								{sec.sessions.location}
							</p>
						</div>
						{/* TODO: wire up session revocation once DELETE /admin/me/sessions is live */}
						<Button
							variant="ghost"
							size="sm"
							className="text-tone-red-fg hover:text-tone-red-fg"
						>
							Revoke all
						</Button>
					</div>
				</Card>
			</div>
		</div>
	);
}
