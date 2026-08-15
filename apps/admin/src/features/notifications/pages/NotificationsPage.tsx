import { useState, type ReactNode } from 'react';
import { Send } from 'lucide-react';

import { Button, PageHeader, Tabs, TabsContent, TabsList, TabsTrigger } from '@repo/ui';

import { usePermissions } from '@/features/auth/hooks';
import { useAppT } from '@/locales';

import {
	useNotificationRules,
	useNotificationStats,
	useNotificationTemplates,
	type NotificationChannel,
} from '../api/notifications.queries';
import { NotificationComposeSheet } from '../components/NotificationComposeSheet';
import { SmsStatusPill } from '../components/SmsStatusPill';
import type { TemplateFocusRequest } from '../lib/template-key';
import { OutboxPage } from './OutboxPage';
import { RulesPage } from './RulesPage';
import { SettingsPage } from './SettingsPage';
import { TemplatesPage } from './TemplatesPage';

/**
 * The Communication console — one header with the SMS-health pill and a "Send
 * message" action, over a row of underline tabs: the reminder rules that decide
 * when messages fire, the templates that say what they say, and the outbox of
 * what actually went out. SMS/provider setup lives under its own tab (OWNER-only)
 * until a global Settings page exists.
 *
 * Each tab carries a live count read from its own list/stats query (shared with
 * the tab body's query cache, so the number costs no extra fetch). The tab order
 * and layout mirror the design; each tab is still gated on its own permission
 * (cosmetic — the server is authoritative), and the default tab is the first the
 * principal can actually see.
 */

/** Underline-tab styling (the design's tabs), applied over the shared pill Tabs. */
const TAB_LIST_CLASS =
	'h-auto w-full justify-start gap-1 rounded-none border-b border-border bg-transparent p-0';
const TAB_TRIGGER_CLASS =
	'-mb-px h-auto flex-none gap-1.5 rounded-none border-x-0 border-t-0 border-b-2 border-transparent px-3.5 pb-2.5 pt-2 text-[13px] font-medium text-muted-foreground shadow-none data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-none';

export function NotificationsPage() {
	const tn = useAppT('notifications');
	const { can } = usePermissions();

	const canTemplates = can('notification-template.manage');
	const canRules = can('notification-rule.manage');
	const canSend = can('notification.send');
	const canSettings = can('notification-settings.manage');

	// Counts for the tab strip. Each query shares its key with the matching tab
	// body, so mounting them here reads from cache rather than double-fetching.
	const rulesQuery = useNotificationRules({ limit: 100 }, canRules);
	const templatesQuery = useNotificationTemplates({ limit: 100 }, canTemplates);
	const statsQuery = useNotificationStats({}, canSend);

	const ruleRows = rulesQuery.data?.rows ?? [];
	const activeRules = ruleRows.filter((rule) => rule.isActive).length;
	const totalRules = rulesQuery.data?.total ?? ruleRows.length;

	// The Templates tab body only lists templates an active rule sends, so the tab
	// count mirrors that filter. When rules are unavailable (no permission / not
	// loaded) nothing is hidden, so fall back to the full total.
	const activeRuleCodes = rulesQuery.data
		? new Set(
				rulesQuery.data.rows
					.filter((rule) => rule.isActive)
					.map((rule) => rule.templateCode),
			)
		: null;
	const templateCount = !templatesQuery.data
		? undefined
		: activeRuleCodes
			? templatesQuery.data.rows.filter((t) => activeRuleCodes.has(t.code)).length
			: (templatesQuery.data.total ?? templatesQuery.data.rows.length);
	const liveCount =
		(statsQuery.data?.byStatus.QUEUED ?? 0) +
		(statsQuery.data?.byStatus.SENDING ?? 0);

	const rulesCount: ReactNode = rulesQuery.data ? (
		<span className="text-xs font-normal">
			<span className="font-semibold text-primary">{activeRules}</span>
			<span className="text-muted-foreground">/{totalRules}</span>
		</span>
	) : null;

	const templatesCount: ReactNode =
		templateCount != null ? (
			<span className="text-xs font-normal text-muted-foreground">
				{templateCount}
			</span>
		) : null;

	const outboxCount: ReactNode =
		liveCount > 0 ? (
			<span className="text-xs font-normal text-muted-foreground">
				{tn('tab.live', { count: liveCount })}
			</span>
		) : null;

	const tabs = [
		{ value: 'rules', label: tn('tab.rules'), visible: canRules, count: rulesCount },
		{
			value: 'templates',
			label: tn('tab.templates'),
			visible: canTemplates,
			count: templatesCount,
		},
		{
			value: 'outbox',
			label: tn('tab.outbox'),
			visible: canSend,
			count: outboxCount,
		},
		{
			value: 'settings',
			label: tn('tab.settings'),
			visible: canSettings,
			count: null,
		},
	].filter((tab) => tab.visible);

	// The route guard already requires one of these permissions, so an empty list
	// is unreachable in practice — but rendering empty Tabs would be a blank screen,
	// so fall back to the header alone.
	const [tab, setTab] = useState(() => tabs[0]?.value);
	const [composeOpen, setComposeOpen] = useState(false);

	// Set by a rule's trigger badge (Rules tab) to jump to and preselect its
	// template; cleared on leaving the Templates tab so a later, ordinary visit
	// doesn't keep re-landing on a stale rule's template.
	const [templateFocus, setTemplateFocus] = useState<TemplateFocusRequest | null>(null);

	const handleTabChange = (value: string) => {
		setTab(value);
		if (value !== 'templates') setTemplateFocus(null);
	};

	const handleOpenTemplate = (code: string, channels: NotificationChannel[]) => {
		setTemplateFocus({ code, channels });
		setTab('templates');
	};

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-6">
			<PageHeader
				title={tn('title')}
				description={tn('description')}
				actions={
					<>
						{canSettings && <SmsStatusPill />}
						{canSend && (
							<Button size="sm" onClick={() => setComposeOpen(true)}>
								<Send className="mr-1.5 size-4" />
								{tn('console.sendMessage')}
							</Button>
						)}
					</>
				}
			/>

			{tab && (
				<Tabs
					value={tab}
					onValueChange={handleTabChange}
					className="flex flex-col gap-6"
				>
					<TabsList className={TAB_LIST_CLASS}>
						{tabs.map((item) => (
							<TabsTrigger
								key={item.value}
								value={item.value}
								className={TAB_TRIGGER_CLASS}
							>
								{item.label}
								{item.count}
							</TabsTrigger>
						))}
					</TabsList>

					{canRules && (
						<TabsContent value="rules">
							<RulesPage
								onOpenTemplate={
									canTemplates ? handleOpenTemplate : undefined
								}
							/>
						</TabsContent>
					)}
					{canTemplates && (
						<TabsContent value="templates">
							<TemplatesPage focusRequest={templateFocus} />
						</TabsContent>
					)}
					{canSend && (
						<TabsContent value="outbox">
							<OutboxPage />
						</TabsContent>
					)}
					{canSettings && (
						<TabsContent value="settings">
							<SettingsPage />
						</TabsContent>
					)}
				</Tabs>
			)}

			{canSend && (
				<NotificationComposeSheet
					open={composeOpen}
					onOpenChange={setComposeOpen}
				/>
			)}
		</div>
	);
}
