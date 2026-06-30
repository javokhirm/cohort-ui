import { useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

import {
	Button,
	Card,
	Skeleton,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
} from '@repo/ui';

import { auditKeys } from '@/api/audit/keys';
import type { AuditLogFilters } from '@/api/audit/types';
import { listAuditLogs } from '@/api/audit/auditLog.queries';
import { formatDateTime as formatTimestamp } from '@/lib/formatters/date';

// ─── Constants ────────────────────────────────────────────────────────────────

const PAGE_SIZE = 20;

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AuditLogPage() {
	const navigate = useNavigate();
	const [search, setSearch] = useState('');
	const [debouncedSearch, setDebouncedSearch] = useState('');
	const [page, setPage] = useState(1);

	const filters: AuditLogFilters = {
		search: debouncedSearch || undefined,
		page,
		limit: PAGE_SIZE,
	};

	const { data, isLoading, isError } = useQuery({
		queryKey: auditKeys.list(filters),
		queryFn: () => listAuditLogs(filters),
		placeholderData: keepPreviousData,
	});

	function handleSearch(e: React.ChangeEvent<HTMLInputElement>) {
		const val = e.target.value;
		setSearch(val);
		setPage(1);
		const timer = setTimeout(() => setDebouncedSearch(val), 300);
		return () => clearTimeout(timer);
	}

	const rows = data?.rows ?? [];
	const totalPages = data?.totalPages ?? 1;
	const total = data?.total ?? 0;
	const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
	const rangeEnd = Math.min(page * PAGE_SIZE, total);

	return (
		<div className="flex flex-col gap-6">
			{/* ── Page header ──────────────────────────────────────────────── */}
			<div>
				<h1 className="text-xl font-semibold tracking-tight">Audit Log</h1>
				<p className="text-sm text-muted-foreground">
					Platform-wide action trail — newest first
					{total > 0 ? ` · ${total} entries` : ''}
				</p>
			</div>

			{/* ── Filter bar ───────────────────────────────────────────────── */}
			<div className="flex flex-wrap items-center gap-3">
				<div className="relative">
					<Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<input
						type="search"
						value={search}
						onChange={handleSearch}
						placeholder="Search action, actor, tenant…"
						className="h-9 w-72 rounded-md border border-input bg-background pl-8 pr-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					/>
				</div>
			</div>

			{/* ── Error state ──────────────────────────────────────────────── */}
			{isError && (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					Failed to load audit logs. Please refresh.
				</div>
			)}

			{/* ── Table ────────────────────────────────────────────────────── */}
			<Card className="gap-0 overflow-hidden py-0">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-44">Timestamp</TableHead>
							<TableHead>Actor</TableHead>
							<TableHead>Tenant</TableHead>
							<TableHead>Action</TableHead>
							<TableHead>Entity</TableHead>
							<TableHead>IP Address</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							Array.from({ length: 8 }, (_, i) => (
								<TableRow key={i}>
									{Array.from({ length: 6 }, (_, j) => (
										<TableCell key={j}>
											<Skeleton className="h-4 w-full" />
										</TableCell>
									))}
								</TableRow>
							))
						) : rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={6}
									className="py-16 text-center text-sm text-muted-foreground"
								>
									No audit log entries match your filters.
								</TableCell>
							</TableRow>
						) : (
							rows.map((entry) => (
								<TableRow
									key={entry.id}
									className="cursor-pointer"
									onClick={() =>
										void navigate({
											// eslint-disable-next-line @typescript-eslint/no-explicit-any
											to: `/audit-log/${entry.id}` as any,
										})
									}
								>
									<TableCell className="text-xs text-muted-foreground tabular-nums">
										{formatTimestamp(entry.timestamp)}
									</TableCell>

									<TableCell className="text-sm">
										<div className="font-medium">
											{entry.actor.name ?? '—'}
										</div>
										{entry.actor.role && (
											<div className="text-xs text-muted-foreground">
												{entry.actor.role}
											</div>
										)}
									</TableCell>

									<TableCell className="text-sm text-muted-foreground">
										{entry.tenant ? (
											entry.tenant.name
										) : (
											<span className="italic">Platform</span>
										)}
									</TableCell>

									<TableCell>
										<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
											{entry.action}
										</code>
									</TableCell>

									<TableCell className="text-xs text-muted-foreground">
										{entry.entityType
											? `${entry.entityType}${entry.entityId != null ? ` #${entry.entityId}` : ''}`
											: '—'}
									</TableCell>

									<TableCell className="text-xs text-muted-foreground tabular-nums">
										{entry.ipAddress ?? '—'}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>

				{/* ── Pagination footer ─────────────────────────────────────── */}
				<div className="flex items-center justify-between border-t border-border px-4 py-3">
					<p className="text-xs text-muted-foreground">
						{total === 0
							? 'No results'
							: `Showing ${rangeStart}–${rangeEnd} of ${total} entries`}
					</p>

					{totalPages > 1 && (
						<div className="flex items-center gap-0.5">
							<Button
								variant="ghost"
								size="icon"
								className="size-8"
								disabled={page <= 1}
								onClick={() => setPage((p) => p - 1)}
							>
								<ChevronLeft className="size-4" />
							</Button>
							{Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
								const p = i + 1;
								return (
									<Button
										key={p}
										variant={p === page ? 'default' : 'ghost'}
										size="icon"
										className="size-8 text-xs"
										onClick={() => setPage(p)}
									>
										{p}
									</Button>
								);
							})}
							<Button
								variant="ghost"
								size="icon"
								className="size-8"
								disabled={page >= totalPages}
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
