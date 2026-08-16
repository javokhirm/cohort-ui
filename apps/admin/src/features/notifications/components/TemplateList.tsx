import { useMemo } from 'react';
import { Search } from 'lucide-react';

import { cn, Input, StatusBadge } from '@repo/ui';

import { useAppT } from '@/locales';

import type {
	NotificationTemplate,
	TemplateModeration,
} from '../api/notifications.queries';
import { moderationFor } from '../lib/moderation';
import { templateKey } from '../lib/template-key';
import { TemplateModerationIcon } from './TemplateModerationBadge';

interface TemplateListProps {
	templates: NotificationTemplate[];
	selectedKey: string | null;
	onSelect: (template: NotificationTemplate) => void;
	query: string;
	onQueryChange: (query: string) => void;
	/** SMS moderation state, indexed by the body it was submitted from. */
	moderation: Map<string, TemplateModeration>;
}

/**
 * The master pane: a filterable list of every template — the code-owned defaults
 * merged with the center's customizations — one row per code / channel / locale.
 * A green dot marks an active row, a hollow one an inactive; the active row is
 * highlighted with a left accent. Selecting a row opens it in the editor.
 *
 * Filtering is a plain client-side match on code, channel and locale (the set is
 * a small config table, so there is nothing to paginate or debounce).
 */
export function TemplateList({
	templates,
	selectedKey,
	onSelect,
	query,
	onQueryChange,
	moderation,
}: TemplateListProps) {
	const tn = useAppT('notifications');

	const filtered = useMemo(() => {
		const needle = query.trim().toLowerCase();
		if (!needle) return templates;
		return templates.filter((t) =>
			`${t.code} ${t.channel} ${t.locale}`.toLowerCase().includes(needle),
		);
	}, [templates, query]);

	return (
		<div className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
			<div className="border-b border-border p-2">
				<div className="relative">
					<Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
					<Input
						value={query}
						onChange={(e) => onQueryChange(e.target.value)}
						placeholder={tn('templates.searchPlaceholder')}
						className="h-9 pl-8"
					/>
				</div>
			</div>

			<div className="max-h-[36rem] flex-1 overflow-y-auto">
				{filtered.length === 0 ? (
					<p className="px-3 py-8 text-center text-xs text-muted-foreground">
						{tn('templates.filterEmpty')}
					</p>
				) : (
					<ul>
						{filtered.map((template) => {
							const key = templateKey(template);
							const selected = key === selectedKey;
							return (
								<li key={key}>
									<button
										type="button"
										onClick={() => onSelect(template)}
										className={cn(
											'flex w-full items-center gap-2 border-b border-l-2 border-border border-l-transparent px-3 py-2.5 text-left transition-colors last:border-b-0 hover:bg-muted/50',
											selected &&
												'border-l-primary bg-primary/5 hover:bg-primary/5',
										)}
									>
										<span className="min-w-0 flex-1">
											<span
												className={cn(
													'block truncate font-mono text-xs font-semibold',
													selected
														? 'text-primary'
														: 'text-foreground',
												)}
											>
												{template.code}
											</span>
											<span className="mt-0.5 block truncate text-xs text-muted-foreground">
												{template.body}
											</span>
										</span>
										{/* Only copy the gateway will not currently
										    deliver — approved rows stay quiet. */}
										<TemplateModerationIcon
											moderation={moderationFor(
												moderation,
												template,
											)}
										/>
										<StatusBadge
											kind="channel"
											status={template.channel}
										>
											{tn(`channel.${template.channel}`)}
										</StatusBadge>
										<span className="w-6 shrink-0 text-center text-[11px] font-semibold uppercase text-muted-foreground">
											{template.locale}
										</span>
										<span
											aria-hidden
											className={cn(
												'size-2 shrink-0 rounded-full',
												template.isActive
													? 'bg-tone-green-fg'
													: 'bg-muted-foreground/30',
											)}
										/>
									</button>
								</li>
							);
						})}
					</ul>
				)}
			</div>
		</div>
	);
}
