import { useMemo, useState } from 'react';
import { BellRing, CalendarClock, Plus, SquarePen, Zap } from 'lucide-react';

import { isApiError } from '@repo/api-client';
import {
	Alert,
	AlertDescription,
	Button,
	Card,
	cn,
	ConfirmDialog,
	EmptyState,
	Spinner,
	StatusBadge,
	Switch,
	toast,
} from '@repo/ui';
import { useT } from '@repo/i18n';

import { Can } from '@/components/Can';
import { useAppT } from '@/locales';

import {
	useNotificationRules,
	useNotificationTriggers,
	type NotificationRule,
	type NotificationTrigger,
} from '../api/notifications.queries';
import {
	useDeleteNotificationRule,
	useToggleNotificationRule,
} from '../api/notifications.mutations';
import { ChannelBadges } from '../components/ChannelBadges';
import { RuleForm } from '../components/RuleForm';
import { ruleDisplayLabel } from '../lib/rule-name';

/** Active-state filter for the pill row. */
type RuleFilter = 'all' | 'active' | 'paused';

const EVENT_GROUP_KEY = '__event__';

/**
 * A card of rules that share a firing model. Scheduled triggers each get their own
 * group (a `trigger` = one offset ladder); every event-driven rule collapses into
 * a single "Event-driven" group, since they share no anchor to order by.
 */
type RuleGroup =
	| { type: 'scheduled'; key: string; label: string; rules: NotificationRule[] }
	| { type: 'event'; key: string; rules: NotificationRule[] };

/**
 * A rule is scheduled when its trigger's catalog entry says so. The catalog can be
 * mid-load or miss an unknown trigger, so fall back to "has an offset" — a
 * scheduled rule always carries one and an event rule never does.
 */
function ruleIsScheduled(rule: NotificationRule, trigger?: NotificationTrigger): boolean {
	if (trigger) return trigger.kind === 'SCHEDULED';
	return rule.offsetDays != null;
}

/** Group rules for display: scheduled ladders first (in catalog order), events last. */
function buildGroups(
	rules: NotificationRule[],
	triggerByCode: Map<string, NotificationTrigger>,
	order: Map<string, number>,
): RuleGroup[] {
	const scheduled = new Map<string, NotificationRule[]>();
	const events: NotificationRule[] = [];

	for (const rule of rules) {
		if (ruleIsScheduled(rule, triggerByCode.get(rule.trigger))) {
			const list = scheduled.get(rule.trigger) ?? [];
			list.push(rule);
			scheduled.set(rule.trigger, list);
		} else {
			events.push(rule);
		}
	}

	const scheduledGroups: RuleGroup[] = [];
	for (const [key, list] of scheduled) {
		// Firing order within a ladder: earliest offset first (D−3 before D0).
		list.sort((a, b) => (a.offsetDays ?? 0) - (b.offsetDays ?? 0));
		scheduledGroups.push({
			type: 'scheduled',
			key,
			label: triggerByCode.get(key)?.label ?? key,
			rules: list,
		});
	}
	scheduledGroups.sort((a, b) => {
		const oa = order.get(a.key) ?? Number.MAX_SAFE_INTEGER;
		const ob = order.get(b.key) ?? Number.MAX_SAFE_INTEGER;
		if (oa !== ob) return oa - ob;
		return (a.type === 'scheduled' ? a.label : '').localeCompare(
			b.type === 'scheduled' ? b.label : '',
		);
	});

	const groups = [...scheduledGroups];
	if (events.length > 0) {
		events.sort((a, b) => {
			const la = triggerByCode.get(a.trigger)?.label ?? a.trigger;
			const lb = triggerByCode.get(b.trigger)?.label ?? b.trigger;
			return la.localeCompare(lb) || a.id - b.id;
		});
		groups.push({ type: 'event', key: EVENT_GROUP_KEY, rules: events });
	}

	return groups;
}

/** The D-offset chip for a scheduled rule: `D−3`, `D0`, `D+3`. */
function offsetLabel(rule: NotificationRule): string {
	const days = rule.offsetDays;
	if (days == null || days === 0) return 'D0';
	// U+2212 minus, not a hyphen, so the sign reads at a glance.
	return days > 0 ? `D+${days}` : `D−${Math.abs(days)}`;
}

/**
 * The Rules tab — every reminder the center sends, grouped by how it fires: each
 * scheduled trigger as its own offset ladder, all event-driven rules together.
 * A pill row filters by active state; a row (or its pencil) opens the builder
 * ({@link RuleForm}), where creating and deleting also happen.
 *
 * The toggle hits the dedicated endpoint and waits for confirmation rather than
 * updating optimistically — "did SMS actually stop?" is not a question to answer
 * on a hunch.
 */
interface RulesPageProps {
	/** Jump to the Templates tab, search bar seeded with a rule's template code; omitted when that tab isn't reachable. */
	onOpenTemplate?: (code: string) => void;
}

export function RulesPage({ onOpenTemplate }: RulesPageProps) {
	const tn = useAppT('notifications');
	const tc = useT('common');

	const { data: triggers } = useNotificationTriggers();
	const { data, isLoading, isError } = useNotificationRules({ limit: 100 });
	const toggleRule = useToggleNotificationRule();
	const deleteRule = useDeleteNotificationRule();

	const [filter, setFilter] = useState<RuleFilter>('all');
	const [formOpen, setFormOpen] = useState(false);
	const [editing, setEditing] = useState<NotificationRule | undefined>();
	const [deleting, setDeleting] = useState<NotificationRule | null>(null);

	const triggerByCode = useMemo(() => {
		const map = new Map<string, NotificationTrigger>();
		for (const trigger of triggers ?? []) map.set(trigger.trigger, trigger);
		return map;
	}, [triggers]);

	const triggerOrder = useMemo(() => {
		const map = new Map<string, number>();
		(triggers ?? []).forEach((trigger, index) => map.set(trigger.trigger, index));
		return map;
	}, [triggers]);

	const rows = useMemo(() => data?.rows ?? [], [data]);
	const activeCount = useMemo(() => rows.filter((r) => r.isActive).length, [rows]);
	const counts: Record<RuleFilter, number> = {
		all: rows.length,
		active: activeCount,
		paused: rows.length - activeCount,
	};

	const groups = useMemo(() => {
		const filtered = rows.filter((rule) =>
			filter === 'all'
				? true
				: filter === 'active'
					? rule.isActive
					: !rule.isActive,
		);
		return buildGroups(filtered, triggerByCode, triggerOrder);
	}, [rows, filter, triggerByCode, triggerOrder]);

	const onToggle = async (rule: NotificationRule, isActive: boolean) => {
		try {
			await toggleRule.mutateAsync({ id: rule.id, isActive });
			toast.success(isActive ? tn('rules.enabled') : tn('rules.disabled'));
		} catch (err) {
			toast.error(isApiError(err) ? err.message : tn('rules.toggleFailed'));
		}
	};

	const onDelete = async () => {
		if (!deleting) return;
		try {
			await deleteRule.mutateAsync(deleting.id);
			toast.success(tn('rules.deleted'));
			setDeleting(null);
		} catch (err) {
			toast.error(isApiError(err) ? err.message : tn('rules.deleteFailed'));
		}
	};

	const openCreate = () => {
		setEditing(undefined);
		setFormOpen(true);
	};

	const openEdit = (rule: NotificationRule) => {
		setEditing(rule);
		setFormOpen(true);
	};

	const requestDelete = () => {
		if (!editing) return;
		setFormOpen(false);
		setDeleting(editing);
	};

	const hasRules = rows.length > 0;
	const isEmpty = !isLoading && !isError && rows.length === 0;
	const isFilteredEmpty = !isLoading && !isError && hasRules && groups.length === 0;

	const stepCountLabel = (group: RuleGroup): string =>
		group.type === 'event'
			? tn('rules.countLabel', { count: group.rules.length })
			: group.rules.length === 1
				? tn('rules.stepCountOne')
				: tn('rules.stepsCount', { count: group.rules.length });

	return (
		<div className="flex flex-col gap-5">
			<div className="flex flex-wrap items-center justify-between gap-3">
				{hasRules ? (
					<div className="flex items-center gap-1.5">
						{(['all', 'active', 'paused'] as const).map((value) => {
							const selected = filter === value;
							return (
								<button
									key={value}
									type="button"
									onClick={() => setFilter(value)}
									className={cn(
										'flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
										selected
											? 'border-primary/30 bg-primary/10 text-primary'
											: 'border-border text-muted-foreground hover:bg-muted/60',
									)}
								>
									{tn(`rules.filter.${value}`)}
									<span
										className={
											selected
												? 'text-primary'
												: 'text-muted-foreground'
										}
									>
										{counts[value]}
									</span>
								</button>
							);
						})}
					</div>
				) : (
					<span />
				)}

				<div className="flex items-center gap-3">
					<span className="hidden text-xs text-muted-foreground lg:block">
						{tn('rules.catalogHint')}
					</span>
					<Can permission="notification-rule.manage">
						<Button variant="outline" size="sm" onClick={openCreate}>
							<Plus className="mr-1.5 size-4" />
							{tn('rules.newRule')}
						</Button>
					</Can>
				</div>
			</div>

			{isError && (
				<Alert variant="destructive">
					<AlertDescription>{tn('rules.loadError')}</AlertDescription>
				</Alert>
			)}

			{isLoading ? (
				<div className="flex items-center justify-center py-16 text-muted-foreground">
					<Spinner className="size-5" />
				</div>
			) : isEmpty ? (
				<Card className="py-0">
					<EmptyState icon={<BellRing />} title={tn('rules.empty')} />
				</Card>
			) : isFilteredEmpty ? (
				<Card className="py-0">
					<EmptyState
						icon={<BellRing />}
						title={tn('rules.filterEmpty')}
						description={tn('rules.filterEmptyHint')}
					/>
				</Card>
			) : (
				<div className="flex flex-col gap-4">
					{groups.map((group) => {
						const scheduled = group.type === 'scheduled';
						return (
							<Card key={group.key} className="overflow-hidden py-0 gap-0">
								<div className="flex items-start justify-between gap-3 px-4 py-3.5 bg-muted/40">
									<div className="flex items-start gap-3">
										<span
											className={cn(
												'flex size-9 shrink-0 items-center justify-center rounded-lg [&>svg]:size-4',
												scheduled
													? 'bg-tone-indigo-bg text-tone-indigo-fg'
													: 'bg-tone-cyan-bg text-tone-cyan-fg',
											)}
										>
											{scheduled ? <CalendarClock /> : <Zap />}
										</span>
										<div className="flex flex-col gap-0.5">
											<div className="flex items-center gap-2">
												<span className="text-sm font-semibold text-foreground">
													{scheduled
														? group.label
														: tn('rules.eventGroup')}
												</span>
												<StatusBadge
													tone={scheduled ? 'indigo' : 'cyan'}
												>
													{tn(
														scheduled
															? 'rules.kind.scheduled'
															: 'rules.kind.event',
													)}
												</StatusBadge>
											</div>
											<span className="text-xs text-muted-foreground">
												{tn(
													scheduled
														? 'rules.scheduledHint'
														: 'rules.eventHint',
												)}
											</span>
										</div>
									</div>
									<span className="shrink-0 pt-0.5 text-xs text-muted-foreground">
										{stepCountLabel(group)}
									</span>
								</div>

								<div className="border-t">
									{group.rules.map((rule) => {
										const label = ruleDisplayLabel(
											rule,
											triggerByCode.get(rule.trigger),
											tn,
										);
										return (
											<div
												key={rule.id}
												className={cn(
													'flex items-center gap-3 border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/40',
													!rule.isActive && 'opacity-60',
												)}
											>
												<button
													type="button"
													onClick={() => openEdit(rule)}
													className="flex min-w-0 flex-1 items-center gap-3 text-left"
												>
													<span
														className={cn(
															'inline-flex min-w-11 shrink-0 justify-center rounded-md px-1.5 py-0.5 font-mono text-xs font-semibold',
															scheduled
																? 'bg-tone-indigo-bg text-tone-indigo-fg'
																: 'bg-tone-cyan-bg text-tone-cyan-fg',
														)}
													>
														{scheduled
															? offsetLabel(rule)
															: tn('rules.eventChip')}
													</span>
													<span className="min-w-0">
														<span className="block truncate text-sm font-medium">
															{label}
														</span>
														<span className="block truncate text-xs text-muted-foreground">
															{tn(
																`audience.${rule.audience}`,
															)}
														</span>
													</span>
												</button>

												<ChannelBadges channels={rule.channels} />

												{onOpenTemplate ? (
													<button
														type="button"
														onClick={() =>
															onOpenTemplate(
																rule.templateCode,
															)
														}
														title={tn(
															'rules.openTemplateAria',
															{
																code: rule.templateCode,
															},
														)}
														className="hidden w-40 shrink-0 truncate rounded-sm text-left font-mono text-xs font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 md:block"
													>
														{rule.trigger}
													</button>
												) : (
													<code className="hidden w-40 shrink-0 truncate font-mono text-xs font-semibold text-primary md:block">
														{rule.trigger}
													</code>
												)}

												<Can permission="notification-rule.manage">
													<Switch
														checked={rule.isActive}
														onCheckedChange={(checked) =>
															void onToggle(rule, checked)
														}
														disabled={toggleRule.isPending}
														aria-label={tn(
															'rules.toggleAria',
															{
																name: label,
															},
														)}
													/>
													<Button
														variant="ghost"
														size="icon"
														className="size-8 shrink-0 text-muted-foreground"
														onClick={() => openEdit(rule)}
														aria-label={tn('rules.edit')}
													>
														<SquarePen className="size-4" />
													</Button>
												</Can>
											</div>
										);
									})}
								</div>
							</Card>
						);
					})}
				</div>
			)}

			<RuleForm
				open={formOpen}
				onOpenChange={setFormOpen}
				rule={editing}
				onDelete={editing ? requestDelete : undefined}
			/>

			<ConfirmDialog
				open={deleting !== null}
				onOpenChange={(open) => {
					if (!open) setDeleting(null);
				}}
				title={tn('rules.deleteTitle')}
				description={tn('rules.deleteDescription', {
					name: deleting
						? ruleDisplayLabel(
								deleting,
								triggerByCode.get(deleting.trigger),
								tn,
							)
						: '',
				})}
				confirmLabel={tc('action.delete')}
				variant="destructive"
				loading={deleteRule.isPending}
				onConfirm={() => void onDelete()}
			/>
		</div>
	);
}
