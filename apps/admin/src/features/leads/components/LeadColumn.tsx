import { useState } from 'react';

import { Button, cn, resolveStatus, Spinner, TONE_ACCENT_CLASSES } from '@repo/ui';
import { useStatusLabel } from '@repo/i18n';

import { useAppT } from '@/locales';

import type { LeadListFilters } from '../api/keys';
import {
	useLeadColumnPages,
	type LeadCard as LeadCardType,
	type LeadStatus,
} from '../api/leads.queries';
import { canMoveLead } from '../lib/lead-options';
import { LeadCard } from './LeadCard';

interface LeadColumnProps {
	status: LeadStatus;
	total: number;
	/** Page 1 of cards, delivered by the board query. */
	boardItems: LeadCardType[];
	filters: LeadListFilters;
	draggingId: number | null;
	draggingFrom: LeadStatus | null;
	onOpenLead: (id: number) => void;
	onDragStartLead: (lead: LeadCardType) => void;
	onDragEndLead: () => void;
	onDropLead: (target: LeadStatus) => void;
}

/** One pipeline column: header, cards (board page 1 + loaded pages), drop target. */
export function LeadColumn({
	status,
	total,
	boardItems,
	filters,
	draggingId,
	draggingFrom,
	onOpenLead,
	onDragStartLead,
	onDragEndLead,
	onDropLead,
}: LeadColumnProps) {
	const t = useAppT('leads');
	const statusLabel = useStatusLabel();
	const [expanded, setExpanded] = useState(false);
	const [isOver, setIsOver] = useState(false);

	const { data, isFetching, hasNextPage, fetchNextPage } = useLeadColumnPages(
		status,
		filters,
		expanded,
	);

	const descriptor = resolveStatus('lead', status);
	const isOpenStage = status !== 'ENROLLED' && status !== 'LOST';
	const isValidTarget = draggingFrom != null && canMoveLead(draggingFrom, status);

	// Board page 1 + any loaded pages, de-duplicated (a board refetch may overlap).
	const extraRows = data?.pages.flatMap((p) => p.rows) ?? [];
	const seen = new Set<number>();
	const items: LeadCardType[] = [];
	for (const card of [...boardItems, ...extraRows]) {
		if (!seen.has(card.id)) {
			seen.add(card.id);
			items.push(card);
		}
	}
	const hasMore = items.length < total;

	function handleLoadMore() {
		if (!expanded) {
			setExpanded(true);
			return;
		}
		if (hasNextPage) void fetchNextPage();
	}

	function handleDragOver(e: React.DragEvent) {
		if (!isValidTarget) return;
		e.preventDefault();
		setIsOver(true);
	}

	function handleDrop(e: React.DragEvent) {
		e.preventDefault();
		setIsOver(false);
		if (isValidTarget) onDropLead(status);
	}

	return (
		<div
			onDragOver={handleDragOver}
			onDragLeave={() => setIsOver(false)}
			onDrop={handleDrop}
			className={cn(
				'flex max-h-full w-67 shrink-0 flex-col rounded-xl border transition-colors',
				isValidTarget && isOver
					? 'border-dashed border-primary bg-primary/5'
					: 'border-border bg-muted/40',
			)}
		>
			<div className="flex items-center justify-between border-b border-border px-3.5 py-3">
				<div className="flex items-center gap-2">
					<span
						className={cn(
							'size-2 rounded-full',
							TONE_ACCENT_CLASSES[descriptor.tone].dot,
						)}
					/>
					<span className="text-sm font-bold">
						{statusLabel('lead', status)}
					</span>
				</div>
				<span className="rounded-md border border-border bg-card px-2 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">
					{total}
				</span>
			</div>

			<div className="flex flex-col gap-2.5 overflow-y-auto p-2.5">
				{items.map((lead) => (
					<LeadCard
						key={lead.id}
						lead={lead}
						draggable={isOpenStage}
						isDragging={draggingId === lead.id}
						onOpen={onOpenLead}
						onDragStart={onDragStartLead}
						onDragEnd={onDragEndLead}
					/>
				))}

				{total === 0 && (
					<p className="px-1 py-6 text-center text-xs text-muted-foreground">
						{t('column.empty')}
					</p>
				)}

				{hasMore && (
					<Button
						variant="outline"
						size="sm"
						className="w-full border-dashed text-primary"
						onClick={handleLoadMore}
						disabled={isFetching}
					>
						{isFetching ? (
							<Spinner className="size-4" />
						) : (
							t('column.loadMore')
						)}
					</Button>
				)}
			</div>
		</div>
	);
}
