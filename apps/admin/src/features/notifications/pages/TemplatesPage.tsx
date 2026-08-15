import { useMemo, useState } from 'react';
import { MessageSquare } from 'lucide-react';

import { Alert, AlertDescription, Card, EmptyState, Spinner } from '@repo/ui';

import { usePermissions } from '@/features/auth/hooks';
import { useAppT } from '@/locales';

import {
	useNotificationRules,
	useNotificationTemplates,
	useNotificationTriggers,
	type NotificationTemplate,
} from '../api/notifications.queries';
import { TemplateEditor } from '../components/TemplateEditor';
import { TemplateList } from '../components/TemplateList';
import {
	resolveTemplateKey,
	templateKey,
	type TemplateFocusRequest,
} from '../lib/template-key';

interface TemplatesPageProps {
	/** A rule's template, requested from its trigger badge in the Rules tab; seeds the initial selection. */
	focusRequest?: TemplateFocusRequest | null;
}

/**
 * The Templates tab — a master/detail console. The left pane lists the messages
 * that actually go out — the code-owned defaults merged with the center's own
 * customizations, one row per code / channel / language, and **only for codes an
 * active rule sends** (a template whose rule is off never fires, so it is noise
 * here). The right pane edits the selected one, with a live cost counter,
 * insertable variables and a sample preview. Editing a default saves a
 * customization; reverting deletes it. See {@link TemplateList} and
 * {@link TemplateEditor}.
 *
 * `focusRequest` (a click on a rule's trigger badge, from the Rules tab) seeds
 * which row starts selected — see {@link resolveTemplateKey}. It is only read
 * on mount: this page unmounts whenever the tab isn't active (Radix drops
 * inactive `TabsContent`), so every arrival here is a fresh mount, and a later
 * manual pick in {@link TemplateList} is never overridden by a stale request.
 */
export function TemplatesPage({ focusRequest }: TemplatesPageProps) {
	const tn = useAppT('notifications');
	const { can } = usePermissions();
	const canRules = can('notification-rule.manage');

	const { data, isLoading, isError } = useNotificationTemplates({ limit: 100 });
	const { data: triggers } = useNotificationTriggers();
	// Gated on the rules permission so a template-only manager doesn't 403; when
	// they cannot read rules we simply don't hide anything (see activeRuleCodes).
	const { data: rulesData } = useNotificationRules({ limit: 100 }, canRules);

	const [query, setQuery] = useState('');

	const rows = useMemo(() => data?.rows ?? [], [data]);

	// Rule count per template code, for the editor's "Used by N rules" subtitle.
	const rulesByCode = useMemo(() => {
		const map = new Map<string, number>();
		for (const rule of rulesData?.rows ?? []) {
			map.set(rule.templateCode, (map.get(rule.templateCode) ?? 0) + 1);
		}
		return map;
	}, [rulesData]);

	/**
	 * The set of codes an *active* rule sends. `null` when rules are unavailable
	 * (the principal cannot read them), in which case nothing is hidden.
	 */
	const activeRuleCodes = useMemo(() => {
		if (!rulesData) return null;
		const codes = new Set<string>();
		for (const rule of rulesData.rows) {
			if (rule.isActive) codes.add(rule.templateCode);
		}
		return codes;
	}, [rulesData]);

	const visibleRows = useMemo(
		() => (activeRuleCodes ? rows.filter((r) => activeRuleCodes.has(r.code)) : rows),
		[rows, activeRuleCodes],
	);

	// Lazy init only: resolved once against this mount's first `visibleRows`,
	// never re-run on refetch, so it can't clobber a selection the user makes
	// afterward (see the `focusRequest` note on the component doc comment).
	const [selectedKey, setSelectedKey] = useState<string | null>(() =>
		focusRequest
			? resolveTemplateKey(visibleRows, focusRequest.code, focusRequest.channels)
			: null,
	);

	// Derive the effective selection during render (no effect, so no cascading
	// renders): the chosen key when it still exists among the visible rows,
	// otherwise the first visible row.
	const effectiveKey = useMemo(() => {
		if (visibleRows.length === 0) return null;
		if (selectedKey && visibleRows.some((r) => templateKey(r) === selectedKey)) {
			return selectedKey;
		}
		return templateKey(visibleRows[0]);
	}, [visibleRows, selectedKey]);

	const selected: NotificationTemplate | undefined = useMemo(
		() => visibleRows.find((r) => templateKey(r) === effectiveKey),
		[visibleRows, effectiveKey],
	);

	if (isError) {
		return (
			<Alert variant="destructive">
				<AlertDescription>{tn('templates.loadError')}</AlertDescription>
			</Alert>
		);
	}

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16 text-muted-foreground">
				<Spinner className="size-5" />
			</div>
		);
	}

	if (rows.length === 0) {
		return (
			<Card className="py-0">
				<EmptyState icon={<MessageSquare />} title={tn('templates.empty')} />
			</Card>
		);
	}

	// Templates exist, but none are sent by an active rule.
	if (visibleRows.length === 0) {
		return (
			<Card className="py-0">
				<EmptyState
					icon={<MessageSquare />}
					title={tn('templates.noActive')}
					description={tn('templates.noActiveHint')}
				/>
			</Card>
		);
	}

	return (
		<div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
			<TemplateList
				templates={visibleRows}
				selectedKey={effectiveKey}
				onSelect={(t) => setSelectedKey(templateKey(t))}
				query={query}
				onQueryChange={setQuery}
			/>

			{selected ? (
				<TemplateEditor
					// Encode source/id so a save (SYSTEM→TENANT) or revert
					// (TENANT→SYSTEM) remounts the editor with the server's copy.
					key={`${effectiveKey}:${selected.source}:${selected.id ?? 'default'}`}
					template={selected}
					triggers={triggers}
					ruleCount={rulesByCode.get(selected.code) ?? 0}
				/>
			) : (
				<Card className="py-0">
					<EmptyState
						icon={<MessageSquare />}
						title={tn('templates.selectPrompt')}
						description={tn('templates.selectPromptHint')}
					/>
				</Card>
			)}
		</div>
	);
}
