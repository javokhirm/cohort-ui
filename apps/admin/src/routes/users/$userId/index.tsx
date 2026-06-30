import { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Ban, ChevronRight, KeyRound } from 'lucide-react';

import {
	Avatar,
	AvatarFallback,
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Separator,
	Skeleton,
	Spinner,
	StatusBadge,
	cn,
} from '@repo/ui';
import type { StatusTone } from '@repo/ui';
import { isApiError } from '@repo/api-client';

import { usersKeys } from '@/api/users/keys';
import { getUser } from '@/api/users/users.queries';
import { deactivateUser, resetUserPassword } from '@/api/users/users.mutations';

// ─── Constants ────────────────────────────────────────────────────────────────

const AVATAR_PALETTE = [
	'bg-tone-green-bg text-tone-green-fg',
	'bg-tone-indigo-bg text-tone-indigo-fg',
	'bg-tone-violet-bg text-tone-violet-fg',
	'bg-tone-blue-bg text-tone-blue-fg',
	'bg-tone-cyan-bg text-tone-cyan-fg',
	'bg-tone-pink-bg text-tone-pink-fg',
	'bg-tone-amber-bg text-tone-amber-fg',
	'bg-tone-orange-bg text-tone-orange-fg',
	'bg-tone-red-bg text-tone-red-fg',
	'bg-tone-slate-bg text-tone-slate-fg',
];

const TENANT_AVATAR_PALETTE = [
	'bg-tone-indigo-bg text-tone-indigo-fg',
	'bg-tone-violet-bg text-tone-violet-fg',
	'bg-tone-cyan-bg text-tone-cyan-fg',
	'bg-tone-green-bg text-tone-green-fg',
	'bg-tone-pink-bg text-tone-pink-fg',
	'bg-tone-blue-bg text-tone-blue-fg',
	'bg-tone-amber-bg text-tone-amber-fg',
	'bg-tone-orange-bg text-tone-orange-fg',
	'bg-tone-red-bg text-tone-red-fg',
	'bg-tone-slate-bg text-tone-slate-fg',
];

const ROLE_TONES: Record<string, StatusTone> = {
	OWNER: 'violet',
	ADMIN: 'blue',
	MANAGER: 'cyan',
	TEACHER: 'slate',
};

// ─── Schema ───────────────────────────────────────────────────────────────────

const resetPasswordSchema = z.object({
	newPassword: z
		.string()
		.min(8, 'Password must be at least 8 characters')
		.max(128, 'Password must be at most 128 characters'),
});
type ResetPasswordFormValues = z.infer<typeof resetPasswordSchema>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(firstName: string, lastName: string): string {
	return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

function avatarClass(id: number): string {
	return AVATAR_PALETTE[id % AVATAR_PALETTE.length];
}

function tenantAvatarClass(tenantId: number): string {
	return TENANT_AVATAR_PALETTE[tenantId % TENANT_AVATAR_PALETTE.length];
}

function roleTone(role: string): StatusTone {
	return ROLE_TONES[role] ?? 'slate';
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CenteredNotice({
	message,
	children,
}: {
	message: string;
	children?: React.ReactNode;
}) {
	return (
		<div className="flex flex-col items-center gap-4 py-24 text-center">
			<p className="text-muted-foreground">{message}</p>
			{children ?? (
				<Link to="/users">
					<Button variant="outline">← User directory</Button>
				</Link>
			)}
		</div>
	);
}

function DetailSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<Skeleton className="h-4 w-32" />
			<div className="flex items-center gap-4">
				<Skeleton className="size-12 rounded-full" />
				<div className="flex flex-col gap-2">
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-64" />
				</div>
			</div>
			<div className="flex flex-col gap-2">
				<Skeleton className="h-3 w-40" />
				{Array.from({ length: 2 }, (_, i) => (
					<Skeleton key={i} className="h-16 w-full rounded-lg" />
				))}
			</div>
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function UserDetailPage() {
	const queryClient = useQueryClient();
	const { userId } = useParams({ strict: false }) as { userId?: string };
	const id = Number(userId);
	const validId = userId != null && Number.isInteger(id) && id > 0;

	const [deactivateOpen, setDeactivateOpen] = useState(false);
	const [resetOpen, setResetOpen] = useState(false);

	const {
		data: user,
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: usersKeys.detail(id),
		queryFn: () => getUser(id),
		enabled: validId,
	});

	const deactivateMutation = useMutation({
		mutationFn: () => deactivateUser(id),
		onSuccess: () => {
			void queryClient.invalidateQueries({ queryKey: usersKeys.detail(id) });
			void queryClient.invalidateQueries({ queryKey: usersKeys.all });
			setDeactivateOpen(false);
		},
	});

	const resetPasswordForm = useForm<ResetPasswordFormValues>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: { newPassword: '' },
	});

	const resetPasswordMutation = useMutation({
		mutationFn: (values: ResetPasswordFormValues) =>
			resetUserPassword(id, { newPassword: values.newPassword }),
		onSuccess: () => {
			resetPasswordForm.reset();
			setResetOpen(false);
		},
	});

	function handleResetClose(open: boolean) {
		if (!open) {
			resetPasswordForm.reset();
			resetPasswordMutation.reset();
		}
		setResetOpen(open);
	}

	function handleDeactivateClose(open: boolean) {
		if (!open) deactivateMutation.reset();
		setDeactivateOpen(open);
	}

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
			{/* ── Back link ────────────────────────────────────────────────── */}
			<Link
				to="/users"
				className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				← User directory
			</Link>

			{/* ── User header ──────────────────────────────────────────────── */}
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

			{/* ── Tenant memberships ───────────────────────────────────────── */}
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
									<p className="text-xs text-muted-foreground">
										{m.tenant.subdomain}.educore.uz
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

			{/* ── Reset password dialog ────────────────────────────────────── */}
			<Dialog open={resetOpen} onOpenChange={handleResetClose}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Reset password</DialogTitle>
						<DialogDescription>
							Set a new password for <strong>{fullName}</strong>. They will
							need to use this password on their next login.
						</DialogDescription>
					</DialogHeader>
					<Form {...resetPasswordForm}>
						<form
							onSubmit={resetPasswordForm.handleSubmit((values) =>
								resetPasswordMutation.mutate(values),
							)}
							className="flex flex-col gap-4"
						>
							<FormField
								control={resetPasswordForm.control}
								name="newPassword"
								render={({ field }) => (
									<FormItem>
										<FormLabel>New password</FormLabel>
										<FormControl>
											<Input
												type="password"
												placeholder="Min. 8 characters"
												autoComplete="new-password"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							{resetPasswordMutation.isError && (
								<p className="text-sm text-destructive">
									{isApiError(resetPasswordMutation.error)
										? resetPasswordMutation.error.message
										: 'Failed to reset password. Please try again.'}
								</p>
							)}
							<DialogFooter>
								<Button
									type="button"
									variant="outline"
									onClick={() => handleResetClose(false)}
									disabled={resetPasswordMutation.isPending}
								>
									Cancel
								</Button>
								<Button
									type="submit"
									disabled={resetPasswordMutation.isPending}
								>
									{resetPasswordMutation.isPending && (
										<Spinner className="mr-2 size-4" />
									)}
									Reset password
								</Button>
							</DialogFooter>
						</form>
					</Form>
				</DialogContent>
			</Dialog>

			{/* ── Deactivate dialog ────────────────────────────────────────── */}
			<Dialog open={deactivateOpen} onOpenChange={handleDeactivateClose}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Deactivate user</DialogTitle>
						<DialogDescription>
							This will revoke <strong>{fullName}</strong>'s access across
							all tenants. They will not be able to log in until
							reactivated.
						</DialogDescription>
					</DialogHeader>
					<Separator />
					{deactivateMutation.isError && (
						<p className="text-sm text-destructive">
							{isApiError(deactivateMutation.error)
								? deactivateMutation.error.message
								: 'Failed to deactivate user. Please try again.'}
						</p>
					)}
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => handleDeactivateClose(false)}
							disabled={deactivateMutation.isPending}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							disabled={deactivateMutation.isPending}
							onClick={() => deactivateMutation.mutate()}
						>
							{deactivateMutation.isPending && (
								<Spinner className="mr-2 size-4" />
							)}
							Deactivate
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
