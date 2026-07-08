import { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { Ban, ChevronRight, KeyRound } from 'lucide-react';

import { Avatar, AvatarFallback, Button, StatusBadge, cn } from '@repo/ui';
import { isApiError } from '@repo/api-client';

import { useUserDetail } from '@/features/users/hooks';
import {
	avatarClass,
	getInitials,
	roleTone,
	tenantAvatarClass,
} from '@/features/users/utils';
import { CenteredNotice } from '@/features/users/components/CenteredNotice';
import { DetailSkeleton } from '@/features/users/components/DetailSkeleton';
import { ResetPasswordDialog } from '@/features/users/components/ResetPasswordDialog';
import { DeactivateDialog } from '@/features/users/components/DeactivateDialog';

export function UserDetailPage() {
	const { userId } = useParams({ strict: false }) as { userId?: string };
	const id = Number(userId);
	const validId = userId != null && Number.isInteger(id) && id > 0;

	const [deactivateOpen, setDeactivateOpen] = useState(false);
	const [resetOpen, setResetOpen] = useState(false);

	const { data: user, isLoading, isError, error } = useUserDetail(id, validId);

	if (!validId || (isError && isApiError(error) && error.status === 404)) {
		return <CenteredNotice message="User not found." />;
	}

	if (isLoading) {
		return <DetailSkeleton />;
	}

	if (isError || !user) {
		return (
			<CenteredNotice message="Failed to load this user. Please try again.">
				<Link to="/users">
					<Button variant="outline">← User directory</Button>
				</Link>
			</CenteredNotice>
		);
	}

	const fullName = `${user.firstName} ${user.lastName}`;

	return (
		<div className="flex flex-col gap-6">
			<Link
				to="/users"
				className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				← User directory
			</Link>

			<div className="flex flex-wrap items-center justify-between gap-4">
				<div className="flex items-center gap-4">
					<Avatar className="size-12 shrink-0">
						<AvatarFallback
							className={cn('text-sm font-bold', avatarClass(user.id))}
						>
							{getInitials(user.firstName, user.lastName)}
						</AvatarFallback>
					</Avatar>
					<div className="flex flex-col gap-0.5">
						<div className="flex items-center gap-2">
							<h1 className="text-xl font-bold leading-tight">
								{fullName}
							</h1>
							<StatusBadge tone={user.isActive ? 'green' : 'red'}>
								{user.isActive ? 'Active' : 'Inactive'}
							</StatusBadge>
						</div>
						<div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
							<span>{user.phone}</span>
							{user.email && <span>{user.email}</span>}
						</div>
					</div>
				</div>

				<div className="flex items-center gap-2">
					<Button
						variant="outline"
						size="sm"
						onClick={() => setResetOpen(true)}
					>
						<KeyRound className="size-4" />
						Reset password
					</Button>
					<Button
						variant="destructive"
						size="sm"
						disabled={!user.isActive}
						onClick={() => setDeactivateOpen(true)}
					>
						<Ban className="size-4" />
						Deactivate
					</Button>
				</div>
			</div>

			<div className="flex flex-col gap-3">
				<p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
					Tenant Memberships ({user.memberships.length})
				</p>

				{user.memberships.length === 0 ? (
					<div className="rounded-lg border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
						This user has no tenant memberships.
					</div>
				) : (
					<div className="flex flex-col gap-2">
						{user.memberships.map((m) => (
							<Link
								key={m.tenantId}
								to="/tenants/$tenantId"
								// eslint-disable-next-line @typescript-eslint/no-explicit-any
								params={{ tenantId: String(m.tenant.id) } as any}
								className={cn(
									'flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/50',
								)}
							>
								<Avatar className="size-10 shrink-0">
									<AvatarFallback
										className={cn(
											'text-xs font-bold',
											tenantAvatarClass(m.tenant.id),
										)}
									>
										{getInitials(
											m.tenant.name,
											m.tenant.name.split(' ')[1] ?? '',
										)}
									</AvatarFallback>
								</Avatar>

								<div className="min-w-0 flex-1">
									<p className="truncate text-sm font-medium">
										{m.tenant.name}
									</p>
								</div>

								<div className="flex items-center gap-2">
									{m.roles.map((role) => (
										<StatusBadge key={role} tone={roleTone(role)}>
											{role}
										</StatusBadge>
									))}
									<StatusBadge
										tone={m.status === 'active' ? 'green' : 'amber'}
									>
										{m.status === 'active' ? 'Active' : 'Suspended'}
									</StatusBadge>
									<ChevronRight className="size-4 text-muted-foreground" />
								</div>
							</Link>
						))}
					</div>
				)}
			</div>

			<ResetPasswordDialog
				userId={user.id}
				fullName={fullName}
				open={resetOpen}
				onOpenChange={setResetOpen}
			/>

			<DeactivateDialog
				userId={user.id}
				fullName={fullName}
				open={deactivateOpen}
				onOpenChange={setDeactivateOpen}
			/>
		</div>
	);
}
