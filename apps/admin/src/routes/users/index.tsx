// TODO: replace mock data + local state with useQuery(usersQuery()) once
//       GET /admin/users is ready.

import { useMemo, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

import {
	Avatar,
	AvatarFallback,
	Button,
	Card,
	StatusBadge,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	cn,
} from '@repo/ui';
import type { StatusTone } from '@repo/ui';

import { MOCK_USERS } from './_mock';
import type { UserRole } from './_mock';

// ─── Constants ────────────────────────────────────────────────────────────────

const ALL = MOCK_USERS;
const PAGE_SIZE = 6;

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

const AVATAR_INDEX = new Map(ALL.map((u, i) => [u.id, i]));

const ROLE_TONES: Record<UserRole, StatusTone> = {
	OWNER: 'violet',
	ADMIN: 'blue',
	MANAGER: 'cyan',
	TEACHER: 'slate',
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function avatarClass(id: string) {
	return AVATAR_PALETTE[(AVATAR_INDEX.get(id) ?? 0) % AVATAR_PALETTE.length];
}

function getInitials(name: string): string {
	return name
		.split(' ')
		.slice(0, 2)
		.map((w) => w[0])
		.join('')
		.toUpperCase();
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function UserDirectoryPage() {
	const navigate = useNavigate();
	const [search, setSearch] = useState('');
	const [page, setPage] = useState(0);

	const filtered = useMemo(() => {
		const q = search.trim().toLowerCase();
		if (!q) return ALL;
		return ALL.filter(
			(u) =>
				u.name.toLowerCase().includes(q) ||
				u.email.toLowerCase().includes(q) ||
				u.phone.includes(q),
		);
	}, [search]);

	const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
	const safePage = Math.min(page, pageCount - 1);
	const rows = filtered.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
	const rangeStart = filtered.length === 0 ? 0 : safePage * PAGE_SIZE + 1;
	const rangeEnd = Math.min((safePage + 1) * PAGE_SIZE, filtered.length);

	function handleSearch(value: string) {
		setSearch(value);
		setPage(0);
	}

	return (
		<div className="flex flex-col gap-6">
			{/* ── Page header ──────────────────────────────────────────────── */}
			<div>
				<h1 className="text-xl font-semibold tracking-tight">User Directory</h1>
				<p className="text-sm text-muted-foreground">
					Every person across all tenants. A user can belong to multiple
					centers.
				</p>
			</div>

			{/* ── Search bar ───────────────────────────────────────────────── */}
			<div className="flex items-center gap-3">
				<div className="relative w-80">
					<Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<input
						type="text"
						value={search}
						onChange={(e) => handleSearch(e.target.value)}
						placeholder="Search name, phone or email..."
						className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					/>
				</div>
				<span className="text-sm text-muted-foreground">
					{filtered.length} {filtered.length === 1 ? 'user' : 'users'}
				</span>
			</div>

			{/* ── Table ────────────────────────────────────────────────────── */}
			<Card className="gap-0 overflow-hidden py-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-72">User</TableHead>
							<TableHead>Phone</TableHead>
							<TableHead>Memberships</TableHead>
							<TableHead className="text-right">Tenants</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={4}
									className="py-16 text-center text-sm text-muted-foreground"
								>
									No users match your search.
								</TableCell>
							</TableRow>
						) : (
							rows.map((user) => (
								<TableRow
									key={user.id}
									className="cursor-pointer"
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									onClick={() => navigate({ to: '/users/$userId', params: { userId: user.id } as any })}
								>
									{/* User */}
									<TableCell>
										<div className="flex items-center gap-3">
											<Avatar className="size-8 shrink-0">
												<AvatarFallback
													className={cn(
														'text-xs font-bold',
														avatarClass(user.id),
													)}
												>
													{getInitials(user.name)}
												</AvatarFallback>
											</Avatar>
											<div className="flex flex-col">
												<span className="text-sm font-medium">
													{user.name}
												</span>
												<span className="text-xs text-muted-foreground">
													{user.email}
												</span>
											</div>
										</div>
									</TableCell>

									{/* Phone */}
									<TableCell className="text-sm tabular-nums text-muted-foreground">
										{user.phone}
									</TableCell>

									{/* Memberships */}
									<TableCell>
										<div className="flex flex-wrap gap-1.5">
											{user.memberships.map((m) => (
												<StatusBadge
													key={m.tenantId}
													tone={ROLE_TONES[m.role]}
												>
													{m.role}
												</StatusBadge>
											))}
										</div>
									</TableCell>

									{/* Tenant count */}
									<TableCell className="text-right text-sm font-medium tabular-nums">
										{user.memberships.length}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>

				{/* ── Pagination footer ─────────────────────────────────────── */}
				<div className="flex items-center justify-between border-t border-border px-4 py-3">
					<p className="text-xs text-muted-foreground">
						{filtered.length === 0
							? 'No results'
							: `Showing ${rangeStart}–${rangeEnd} of ${filtered.length} users`}
					</p>

					{pageCount > 1 && (
						<div className="flex items-center gap-0.5">
							<Button
								variant="ghost"
								size="icon"
								className="size-8"
								disabled={safePage === 0}
								onClick={() => setPage((p) => p - 1)}
							>
								<ChevronLeft className="size-4" />
							</Button>
							{Array.from({ length: pageCount }, (_, i) => (
								<Button
									key={i}
									variant={i === safePage ? 'default' : 'ghost'}
									size="icon"
									className="size-8 text-xs"
									onClick={() => setPage(i)}
								>
									{i + 1}
								</Button>
							))}
							<Button
								variant="ghost"
								size="icon"
								className="size-8"
								disabled={safePage >= pageCount - 1}
								onClick={() => setPage((p) => p + 1)}
							>
								<ChevronRight className="size-4" />
							</Button>
						</div>
					)}
				</div>
			</Card>
		</div>
	);
}
