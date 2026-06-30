import { Link, useParams } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

import { Button, Card, CardContent, Skeleton } from '@repo/ui';
import { isApiError } from '@repo/api-client';

import { auditKeys } from '@/api/audit/keys';
import { getAuditLog } from '@/api/audit/audit-logs';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatTimestamp(ts: string): string {
	return new Intl.DateTimeFormat('ru-RU', {
		dateStyle: 'long',
		timeStyle: 'medium',
		timeZone: 'Asia/Tashkent',
	}).format(new Date(ts));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CenteredNotice({ message }: { message: string }) {
	return (
		<div className="flex flex-col items-center gap-4 py-24 text-center">
			<p className="text-muted-foreground">{message}</p>
			<Link
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				to={'/audit-log' as any}
			>
				<Button variant="outline">← Audit Log</Button>
			</Link>
		</div>
	);
}

function DetailSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<Skeleton className="h-4 w-24" />
			<div className="flex flex-col gap-2">
				{Array.from({ length: 5 }, (_, i) => (
					<Skeleton key={i} className="h-10 w-full rounded-lg" />
				))}
			</div>
		</div>
	);
}

function JsonBlock({ value }: { value: Record<string, unknown> | null }) {
	if (!value) {
		return <span className="text-sm text-muted-foreground">—</span>;
	}
	return (
		<pre className="overflow-x-auto rounded-md bg-muted px-4 py-3 text-xs leading-relaxed">
			{JSON.stringify(value, null, 2)}
		</pre>
	);
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
	return (
		<div className="flex gap-4 border-b border-border py-3 last:border-0">
			<dt className="w-36 shrink-0 text-sm text-muted-foreground">{label}</dt>
			<dd className="flex-1 text-sm">{children}</dd>
		</div>
	);
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function AuditLogDetailPage() {
	const { auditId } = useParams({ strict: false }) as { auditId?: string };
	const id = Number(auditId);
	const validId = auditId != null && Number.isInteger(id) && id > 0;

	const {
		data: entry,
		isLoading,
		isError,
		error,
	} = useQuery({
		queryKey: auditKeys.detail(id),
		queryFn: () => getAuditLog(id),
		enabled: validId,
	});

	if (!validId || (isError && isApiError(error) && error.status === 404)) {
		return <CenteredNotice message="Audit log entry not found." />;
	}

	if (isLoading) return <DetailSkeleton />;

	if (isError || !entry) {
		return <CenteredNotice message="Failed to load this entry. Please try again." />;
	}

	return (
		<div className="flex flex-col gap-6">
			{/* ── Back link ────────────────────────────────────────────────── */}
			<Link
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				to={'/audit-log' as any}
				className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				← Audit Log
			</Link>

			{/* ── Header ───────────────────────────────────────────────────── */}
			<div>
				<h1 className="text-xl font-semibold tracking-tight">
					Audit Entry #{entry.id}
				</h1>
				<p className="text-sm text-muted-foreground">
					{formatTimestamp(entry.timestamp)}
				</p>
			</div>

			{/* ── Fields ───────────────────────────────────────────────────── */}
			<Card className="py-0">
				<CardContent className="px-6 py-0">
					<dl>
						<FieldRow label="Action">
							<code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
								{entry.action}
							</code>
						</FieldRow>

						<FieldRow label="Actor">
							<span className="font-medium">{entry.actor.name ?? '—'}</span>
							{entry.actor.role && (
								<span className="ml-2 text-xs text-muted-foreground">
									{entry.actor.role}
								</span>
							)}
							{entry.actor.userId != null && (
								<span className="ml-2 text-xs text-muted-foreground">
									#{entry.actor.userId}
								</span>
							)}
						</FieldRow>

						<FieldRow label="Tenant">
							{entry.tenant ? (
								<Link
									to="/tenants/$tenantId"
									// eslint-disable-next-line @typescript-eslint/no-explicit-any
									params={{ tenantId: String(entry.tenant.id) } as any}
									className="text-primary hover:underline"
								>
									{entry.tenant.name}
									<span className="ml-1 text-xs text-muted-foreground">
										({entry.tenant.subdomain}.educore.uz)
									</span>
								</Link>
							) : (
								<span className="italic text-muted-foreground">
									Platform (no tenant)
								</span>
							)}
						</FieldRow>

						<FieldRow label="Entity">
							{entry.entityType
								? `${entry.entityType}${entry.entityId != null ? ` #${entry.entityId}` : ''}`
								: '—'}
						</FieldRow>

						<FieldRow label="IP Address">{entry.ipAddress ?? '—'}</FieldRow>
					</dl>
				</CardContent>
			</Card>

			{/* ── Before / After diff ──────────────────────────────────────── */}
			<div className="flex flex-col gap-3">
				<h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
					Before / After
				</h2>
				<div className="grid gap-4 md:grid-cols-2">
					<div className="flex flex-col gap-2">
						<p className="text-xs font-medium text-muted-foreground">
							Before
						</p>
						<JsonBlock value={entry.details.before} />
					</div>
					<div className="flex flex-col gap-2">
						<p className="text-xs font-medium text-muted-foreground">After</p>
						<JsonBlock value={entry.details.after} />
					</div>
				</div>
			</div>
		</div>
	);
}
