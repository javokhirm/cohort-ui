import { AlertTriangle, Inbox, RotateCcw } from 'lucide-react';
import { Fragment, useMemo, useState, type ReactNode } from 'react';

import { isApiError } from '@repo/api-client';
import {
	Alert,
	AlertDescription,
	Button,
	Card,
	cn,
	EmptyState,
	Pagination,
	Spinner,
	StatusBadge,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	toast,
} from '@repo/ui';
import { formatDateTime, formatNumber, toIsoDate, todayIsoDate } from '@repo/utils';

import { Can } from '@/components/Can';
import { usePermissions } from '@/features/auth/hooks';
import { useAppT } from '@/locales';

import {
	NOTIFICATION_STATUSES,
	useNotificationOutbox,
	useNotificationRules,
	useNotificationStats,
	useNotificationTriggers,
	type NotificationRecord,
	type NotificationRule,
	type NotificationStatus,
	type NotificationTrigger,
} from '../api/notifications.queries';
import { useRetryNotification } from '../api/notifications.mutations';
import { offsetTiming } from '../lib/rule-name';

const PAGE_SIZE = 25;
const DAY_MS = 24 * 60 * 60 * 1000;

/** The time windows over the outbox, mirroring the design's chip row. */
type RangeKey = 'today' | 'week' | 'month' | 'all';
const RANGES: RangeKey[] = ['today', 'week', 'month', 'all'];

/** The status filter chips, in the design's order (`ALL` clears the filter). */
type StatusFilter = 'ALL' | NotificationStatus;
const STATUS_FILTERS: StatusFilter[] = ['ALL', ...NOTIFICATION_STATUSES];

/**
 * Turn a range chip into `from`/`to` bounds on `createdAt`. The upper bound is
 * left open (up to now); `all` clears both. Dates are computed in the center's
 * timezone via `toIsoDate` so "today" means today in Tashkent, not the browser.
 */
function rangeToWindow(range: RangeKey): { from?: string; to?: string } {
	if (range === 'all') return {};
	if (range === 'today') return { from: todayIsoDate() };
	const days = range === 'week' ? 6 : 29;
	return { from: toIsoDate(new Date(Date.now() - days * DAY_MS)) };
}

/**
 * The Outbox — the operational answer to "did the message actually arrive?".
 *
 * A summary strip (delivered / failed / in-flight / segments / delivery rate)
 * sits over a status- and time-filterable delivery log. Each row names its
 * recipient, the rule (or manual send) that produced it, its billable segment
 * count and its delivery status; a failed row expands to its provider error and
 * a retry. The counts and the summary come from `GET /notifications/stats` over
 * the same window, so the chips and the cards always agree.
 *
 * The list polls (see `useNotificationOutbox`) because a `QUEUED` row becomes
 * `SENT`/`DELIVERED` within a minute — the "polling" pill reflects whether
 * anything is still in flight.
 *
 * "Produced by" and the recipient's audience are joined in from the rules and
 * trigger catalog. Those endpoints need `notification-rule.manage`, which the
 * send-only principal may lack — the join then degrades to the template code and
 * the bare phone rather than 403-ing.
 */
export function OutboxPage() {
	const tn = useAppT('notifications');
	const { can } = usePermissions();
	const canRuleManage = can('notification-rule.manage');

	const [page, setPage] = useState(1);
	const [range, setRange] = useState<RangeKey>('week');
	const [status, setStatus] = useState<StatusFilter>('ALL');

	const window = useMemo(() => rangeToWindow(range), [range]);

	const { data, isLoading, isError } = useNotificationOutbox({
		page,
		limit: PAGE_SIZE,
		status: status === 'ALL' ? undefined : status,
		...window,
	});
	// Summary + chip counts come from stats over the *window* (not the status
	// filter), so narrowing to "Failed" never zeroes the other chips.
	const { data: stats } = useNotificationStats(window);

	// The rule/trigger join that powers "Produced by" and the recipient audience.
	const { data: triggers } = useNotificationTriggers(canRuleManage);
	const rulesQuery = useNotificationRules({ limit: 100 }, canRuleManage);

	const retry = useRetryNotification();

	const rulesById = useMemo(() => {
		const map = new Map<number, NotificationRule>();
		for (const rule of rulesQuery.data?.rows ?? []) map.set(rule.id, rule);
		return map;
	}, [rulesQuery.data]);

	const triggerByCode = useMemo(() => {
		const map = new Map<string, NotificationTrigger>();
		for (const trigger of triggers ?? []) map.set(trigger.trigger, trigger);
		return map;
	}, [triggers]);

	const rows = data?.rows ?? [];
	const loadedFailed = rows.filter((row) => row.status === 'FAILED');

	// Summary figures, all from stats over the current window.
	const byStatus = stats?.byStatus ?? {};
	const delivered = byStatus.DELIVERED ?? 0;
	const failed = byStatus.FAILED ?? 0;
	const inFlight = (byStatus.QUEUED ?? 0) + (byStatus.SENDING ?? 0);
	const total = NOTIFICATION_STATUSES.reduce(
		(sum, key) => sum + (byStatus[key] ?? 0),
		0,
	);
	const settled = delivered + failed;
	const deliveryRate = settled > 0 ? Math.round((delivered / settled) * 100) : null;

	const statusCount = (key: StatusFilter): number =>
		key === 'ALL' ? total : (byStatus[key] ?? 0);

	const onRetry = async (row: NotificationRecord) => {
		try {
			await retry.mutateAsync(row.id);
			toast.success(tn('outbox.retried'));
		} catch (err) {
			toast.error(isApiError(err) ? err.message : tn('outbox.retryFailed'));
		}
	};

	// Bulk retry re-queues every FAILED row currently loaded. The single-retry
	// endpoint is looped (there is no bulk endpoint); the button count reflects
	// what is loaded, so the action always matches its label.
	const onRetryAll = async () => {
		if (loadedFailed.length === 0) return;
		const results = await Promise.allSettled(
			loadedFailed.map((row) => retry.mutateAsync(row.id)),
		);
		const rejected = results.filter((r) => r.status === 'rejected').length;
		if (rejected === 0) toast.success(tn('outbox.retried'));
		else toast.error(tn('outbox.retryFailed'));
	};

	/** The "Produced by" cell: the rule's label + timing, or a manual send. */
	const describeSource = (
		row: NotificationRecord,
	): { primary: string; code: string | null } => {
		const code = row.templateCode;
		if (row.ruleId == null) return { primary: tn('outbox.manualSend'), code };

		const rule = rulesById.get(row.ruleId);
		if (!rule) return { primary: tn('outbox.sourceRule', { id: row.ruleId }), code };

		const trigger = triggerByCode.get(rule.trigger);
		const scheduled = trigger
			? trigger.kind === 'SCHEDULED'
			: rule.offsetDays != null;
		const when = scheduled ? offsetTiming(rule.offsetDays, tn) : tn('outbox.onEvent');
		return { primary: `${trigger?.label ?? rule.trigger} · ${when}`, code };
	};

	/** The recipient's audience line: the rule's audience, or a manual send. */
	const recipientRole = (row: NotificationRecord): string | null => {
		if (row.ruleId == null) return tn('outbox.manualSend');
		const rule = rulesById.get(row.ruleId);
		return rule ? tn(`audience.${rule.audience}`) : null;
	};

	const summary: {
		label: string;
		value: ReactNode;
		hint: string;
		valueClass?: string;
	}[] = [
		{
			label: tn('outbox.summary.delivered'),
			value: formatNumber(delivered),
			hint: tn('outbox.summary.deliveredHint'),
			valueClass: 'text-tone-green-fg',
		},
		{
			label: tn('outbox.summary.failed'),
			value: formatNumber(failed),
			hint: tn('outbox.summary.failedHint'),
			valueClass: failed > 0 ? 'text-tone-red-fg' : undefined,
		},
		{
			label: tn('outbox.summary.inFlight'),
			value: formatNumber(inFlight),
			hint: tn('outbox.summary.inFlightHint'),
		},
		{
			label: tn('outbox.summary.segments'),
			value: formatNumber(stats?.totalSegments ?? 0),
			hint: tn('outbox.summary.segmentsHint'),
		},
		{
			label: tn('outbox.summary.deliveryRate'),
			value: deliveryRate == null ? '—' : `${deliveryRate}%`,
			hint: tn('outbox.summary.deliveryRateHint'),
		},
	];

	const isEmpty = !isLoading && !isError && rows.length === 0;

	return (
		<div className="flex flex-col gap-5">
			<div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
				{summary.map((card) => (
					<Card key={card.label} className="gap-1 py-4">
						<div className="flex flex-col gap-1 px-4">
							<span className="text-xs font-medium text-muted-foreground">
								{card.label}
							</span>
							<span
								className={cn(
									'text-2xl font-semibold tabular-nums',
									card.valueClass,
								)}
							>
								{card.value}
							</span>
							<span className="text-xs text-muted-foreground">
								{card.hint}
							</span>
						</div>
					</Card>
				))}
			</div>

			<div className="flex flex-wrap items-center gap-x-4 gap-y-2">
				<div className="flex flex-wrap items-center gap-1.5">
					{STATUS_FILTERS.map((key) => {
						const selected = status === key;
						return (
							<button
								key={key}
								type="button"
								onClick={() => {
									setStatus(key);
									setPage(1);
								}}
								className={cn(
									'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
									selected
										? 'border-primary/30 bg-primary/10 text-primary'
										: 'border-border text-muted-foreground hover:bg-muted/60',
								)}
							>
								{key === 'ALL'
									? tn('outbox.filter.all')
									: tn(`status.${key}`)}
								<span
									className={
										selected
											? 'text-primary'
											: 'text-muted-foreground'
									}
								>
									{statusCount(key)}
								</span>
							</button>
						);
					})}
				</div>

				<div className="ml-auto flex flex-wrap items-center gap-1.5">
					{RANGES.map((key) => {
						const selected = range === key;
						return (
							<button
								key={key}
								type="button"
								onClick={() => {
									setRange(key);
									setPage(1);
								}}
								className={cn(
									'rounded-full border px-3 py-1 text-xs font-medium transition-colors',
									selected
										? 'border-primary/30 bg-primary/10 text-primary'
										: 'border-border text-muted-foreground hover:bg-muted/60',
								)}
							>
								{tn(`outbox.range.${key}`)}
							</button>
						);
					})}
				</div>
			</div>

			<div className="flex flex-wrap items-center justify-between gap-3">
				<span className="flex items-center gap-2 text-xs text-muted-foreground">
					<span
						className={cn(
							'size-1.5 rounded-full',
							inFlight > 0
								? 'animate-pulse bg-tone-blue-fg'
								: 'bg-muted-foreground',
						)}
					/>
					{inFlight > 0
						? tn('outbox.pollingLive', { count: inFlight })
						: tn('outbox.pollingIdle')}
				</span>

				{loadedFailed.length > 0 && (
					<Can permission="notification.send">
						<Button
							variant="outline"
							size="sm"
							className="border-tone-red-fg/30 text-tone-red-fg hover:bg-tone-red-bg hover:text-tone-red-fg"
							onClick={() => void onRetryAll()}
							disabled={retry.isPending}
						>
							<RotateCcw className="mr-1.5 size-3.5" />
							{tn('outbox.retryAll', { count: loadedFailed.length })}
						</Button>
					</Can>
				)}
			</div>

			{isError && (
				<Alert variant="destructive">
					<AlertDescription>{tn('outbox.loadError')}</AlertDescription>
				</Alert>
			)}

			{isLoading ? (
				<div className="flex items-center justify-center py-16 text-muted-foreground">
					<Spinner className="size-5" />
				</div>
			) : isEmpty ? (
				<Card className="py-0">
					<EmptyState icon={<Inbox />} title={tn('outbox.empty')} />
				</Card>
			) : (
				<>
					<Card className="overflow-hidden py-0">
						<Table className="min-w-240">
							<TableHeader>
								<TableRow>
									<TableHead>{tn('outbox.column.recipient')}</TableHead>
									<TableHead className="w-24">
										{tn('outbox.column.channel')}
									</TableHead>
									<TableHead>
										{tn('outbox.column.producedBy')}
									</TableHead>
									<TableHead className="w-24 text-right">
										{tn('outbox.column.segments')}
									</TableHead>
									<TableHead className="w-32">
										{tn('outbox.column.status')}
									</TableHead>
									<TableHead className="w-40">
										{tn('outbox.column.createdAt')}
									</TableHead>
								</TableRow>
							</TableHeader>
							<TableBody>
								{rows.map((row) => {
									const source = describeSource(row);
									const role = recipientRole(row);
									const subtitle = [role, row.recipientPhone]
										.filter(Boolean)
										.join(' · ');
									const isFailed = row.status === 'FAILED';

									return (
										<Fragment key={row.id}>
											<TableRow
												className={
													isFailed ? 'border-b-0' : undefined
												}
											>
												<TableCell className="max-w-0">
													<span className="block truncate text-sm font-medium">
														{row.recipientName ??
															row.recipientPhone ??
															'—'}
													</span>
													{subtitle && (
														<span className="block truncate text-xs text-muted-foreground">
															{subtitle}
														</span>
													)}
												</TableCell>
												<TableCell>
													<StatusBadge
														kind="channel"
														status={row.channel}
													>
														{tn(`channel.${row.channel}`)}
													</StatusBadge>
												</TableCell>
												<TableCell className="max-w-0">
													<span className="block truncate text-sm">
														{source.primary}
													</span>
													<span className="block truncate font-mono text-xs text-muted-foreground">
														{source.code ?? '—'}
													</span>
												</TableCell>
												<TableCell className="text-right text-sm tabular-nums">
													{row.segments ?? '—'}
												</TableCell>
												<TableCell>
													<StatusBadge
														kind="notification"
														status={row.status}
													>
														{tn(`status.${row.status}`)}
													</StatusBadge>
												</TableCell>
												<TableCell className="whitespace-nowrap text-xs text-muted-foreground">
													{formatDateTime(row.createdAt)}
												</TableCell>
											</TableRow>

											{isFailed && (
												<TableRow className="hover:bg-transparent">
													<TableCell
														colSpan={6}
														className="pt-0"
													>
														<div className="flex items-center justify-between gap-3 rounded-lg border border-tone-red-fg/20 bg-tone-red-bg/60 px-3 py-2">
															<span className="flex min-w-0 items-center gap-2 text-xs font-medium text-tone-red-fg">
																<AlertTriangle className="size-3.5 shrink-0" />
																<span className="truncate">
																	{row.error ??
																		tn(
																			'outbox.errorLabel',
																		)}
																	{row.attempts > 0 &&
																		` · ${tn('outbox.attemptShort', { count: row.attempts })}`}
																</span>
															</span>
															<Can permission="notification.send">
																<Button
																	variant="outline"
																	size="sm"
																	className="shrink-0"
																	onClick={() =>
																		void onRetry(row)
																	}
																	disabled={
																		retry.isPending
																	}
																>
																	{tn('outbox.retry')}
																</Button>
															</Can>
														</div>
													</TableCell>
												</TableRow>
											)}
										</Fragment>
									);
								})}
							</TableBody>
						</Table>
					</Card>

					{data && data.totalPages > 1 && (
						<Pagination
							page={data.page}
							pageSize={data.limit}
							total={data.total}
							onPageChange={setPage}
						/>
					)}
				</>
			)}
		</div>
	);
}
