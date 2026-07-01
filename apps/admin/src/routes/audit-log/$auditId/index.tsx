import { Link, useParams } from '@tanstack/react-router';
import { isApiError } from '@repo/api-client';

import { Card, CardContent } from '@repo/ui';

import { formatDateTimeLong as formatTimestamp } from '@repo/utils';
import { useAuditLogEntry } from '@/features/audit-log/hooks';
import { CenteredNotice } from '@/features/audit-log/components/CenteredNotice';
import { DetailSkeleton } from '@/features/audit-log/components/DetailSkeleton';
import { FieldRow } from '@/features/audit-log/components/FieldRow';
import { JsonBlock } from '@/features/audit-log/components/JsonBlock';

export function AuditLogDetailPage() {
	const { auditId } = useParams({ strict: false }) as { auditId?: string };
	const id = Number(auditId);
	const validId = auditId != null && Number.isInteger(id) && id > 0;

	const { data: entry, isLoading, isError, error } = useAuditLogEntry(id, validId);

	if (!validId || (isError && isApiError(error) && error.status === 404)) {
		return <CenteredNotice message="Audit log entry not found." />;
	}

	if (isLoading) return <DetailSkeleton />;

	if (isError || !entry) {
		return <CenteredNotice message="Failed to load this entry. Please try again." />;
	}

	return (
		<div className="flex flex-col gap-6">
			<Link
				// eslint-disable-next-line @typescript-eslint/no-explicit-any
				to={'/audit-log' as any}
				className="inline-flex w-fit items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
			>
				← Audit Log
			</Link>

			<div>
				<h1 className="text-xl font-semibold tracking-tight">
					Audit Entry #{entry.id}
				</h1>
				<p className="text-sm text-muted-foreground">
					{formatTimestamp(entry.timestamp)}
				</p>
			</div>

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
