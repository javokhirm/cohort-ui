// TODO: replace mock data with useQuery(userDetailQuery(userId)) once GET /admin/users/:id is ready.

import { useState } from 'react';
import { Link, useParams } from '@tanstack/react-router';
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
	Separator,
	StatusBadge,
	cn,
} from '@repo/ui';
import type { StatusTone } from '@repo/ui';

import { MOCK_USERS } from '../_mock';
import type { UserRole } from '../_mock';

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

const ROLE_TONES: Record<UserRole, StatusTone> = {
	OWNER: 'violet',
	ADMIN: 'blue',
	MANAGER: 'cyan',
	TEACHER: 'slate',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string): string {
	return name
		.split(' ')
		.slice(0, 2)
		.map((w) => w[0])
		.join('')
		.toUpperCase();
}

function userAvatarClass(userId: string): string {
	const idx = MOCK_USERS.findIndex((u) => u.id === userId);
	return AVATAR_PALETTE[(idx >= 0 ? idx : 0) % AVATAR_PALETTE.length];
}

function tenantAvatarClass(tenantId: string): string {
	const hash = tenantId.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
	return TENANT_AVATAR_PALETTE[hash % TENANT_AVATAR_PALETTE.length];
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function UserDetailPage() {
	const { userId } = useParams({ strict: false }) as { userId?: string };
	const user = MOCK_USERS.find((u) => u.id === userId) ?? null;

	const [deactivateOpen, setDeactivateOpen] = useState(false);
	const [resetOpen, setResetOpen] = useState(false);

	if (!user) {
		return (
			<div className="flex flex-col items-center gap-4 py-24 text-center">
				<p className="text-muted-foreground">User not found.</p>
				<Link to="/users">
					<Button variant="outline">← User directory</Button>
				</Link>
			</div>
		);
	}

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
							className={cn('text-sm font-bold', userAvatarClass(user.id))}
						>
							{getInitials(user.name)}
						</AvatarFallback>
					</Avatar>
					<div className="flex flex-col gap-0.5">
						<h1 className="text-xl font-bold leading-tight">{user.name}</h1>
						<div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
							<span>{user.phone}</span>
							<span>{user.email}</span>
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

				<div className="flex flex-col gap-2">
					{user.memberships.map((m, i) => (
						<Link
							key={m.tenantId}
							to="/tenants/$tenantId"
							// eslint-disable-next-line @typescript-eslint/no-explicit-any
							params={{ tenantId: m.tenantId } as any}
							className={cn(
								'flex items-center gap-4 rounded-lg border border-border bg-card px-4 py-3 transition-colors hover:bg-muted/50',
							)}
						>
							<Avatar className="size-10 shrink-0">
								<AvatarFallback
									className={cn(
										'text-xs font-bold',
										tenantAvatarClass(m.tenantId + i),
									)}
								>
									{getInitials(m.tenantName)}
								</AvatarFallback>
							</Avatar>

							<div className="min-w-0 flex-1">
								<p className="truncate text-sm font-medium">
									{m.tenantName}
								</p>
								<p className="text-xs text-muted-foreground">
									{m.subdomain}.educore.uz
								</p>
							</div>

							<div className="flex items-center gap-2">
								<StatusBadge tone={ROLE_TONES[m.role]}>
									{m.role}
								</StatusBadge>
								<StatusBadge tone="green">
									{m.status === 'active' ? 'Active' : 'Suspended'}
								</StatusBadge>
								<ChevronRight className="size-4 text-muted-foreground" />
							</div>
						</Link>
					))}
				</div>
			</div>

			{/* ── Reset password dialog ────────────────────────────────────── */}
			<Dialog open={resetOpen} onOpenChange={setResetOpen}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Reset password</DialogTitle>
						<DialogDescription>
							Password reset will be available once the users API is ready.
						</DialogDescription>
					</DialogHeader>
					<DialogFooter>
						<Button variant="outline" onClick={() => setResetOpen(false)}>
							Close
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>

			{/* ── Deactivate dialog ────────────────────────────────────────── */}
			<Dialog open={deactivateOpen} onOpenChange={setDeactivateOpen}>
				<DialogContent className="max-w-sm">
					<DialogHeader>
						<DialogTitle>Deactivate user</DialogTitle>
						<DialogDescription>
							This will revoke <strong>{user.name}</strong>'s access across
							all tenants. They will not be able to log in until
							reactivated.
						</DialogDescription>
					</DialogHeader>
					<Separator />
					<DialogFooter>
						<Button
							variant="outline"
							onClick={() => setDeactivateOpen(false)}
						>
							Cancel
						</Button>
						<Button
							variant="destructive"
							onClick={() => {
								// TODO: call deactivate mutation once PATCH /admin/users/:id is ready
								setDeactivateOpen(false);
							}}
						>
							Deactivate
						</Button>
					</DialogFooter>
				</DialogContent>
			</Dialog>
		</div>
	);
}
