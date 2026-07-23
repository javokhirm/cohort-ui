import { cn, StatusBadge } from '@repo/ui';
import { formatRelative } from '@repo/utils';
import { useStatusLabel } from '@repo/i18n';

import { useAppT } from '@/locales';

import type { LeadCard as LeadCardType } from '../api/leads.queries';
import { getInitials, leadFullName } from '../lib/lead-options';

interface LeadCardProps {
	lead: LeadCardType;
	draggable: boolean;
	isDragging: boolean;
	onOpen: (id: number) => void;
	onDragStart: (lead: LeadCardType) => void;
	onDragEnd: () => void;
}

/** A single pipeline card — draggable (open stages only) and click-to-open. */
export function LeadCard({
	lead,
	draggable,
	isDragging,
	onOpen,
	onDragStart,
	onDragEnd,
}: LeadCardProps) {
	const t = useAppT('leads');
	const statusLabel = useStatusLabel();

	return (
		<div
			role="button"
			tabIndex={0}
			draggable={draggable}
			onDragStart={(e) => {
				e.dataTransfer.effectAllowed = 'move';
				onDragStart(lead);
			}}
			onDragEnd={onDragEnd}
			onClick={() => onOpen(lead.id)}
			onKeyDown={(e) => {
				if (e.key === 'Enter' || e.key === ' ') {
					e.preventDefault();
					onOpen(lead.id);
				}
			}}
			className={cn(
				'rounded-lg border border-border bg-card p-3 shadow-sm transition',
				'hover:border-primary/40 hover:shadow-md',
				draggable ? 'cursor-grab active:cursor-grabbing' : 'cursor-pointer',
				isDragging && 'opacity-50',
			)}
		>
			<div className="mb-2 flex items-center gap-2.5">
				<div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10.5px] font-semibold text-primary">
					{getInitials(lead.firstName, lead.lastName)}
				</div>
				<div className="min-w-0">
					<div className="truncate text-sm font-semibold">
						{leadFullName(lead.firstName, lead.lastName)}
					</div>
					<div className="text-xs text-muted-foreground">
						{lead.phoneNumber}
					</div>
				</div>
			</div>

			<div className="mb-2 truncate text-xs text-muted-foreground">
				{lead.courseInterest?.name ?? t('card.noCourseInterest')}
			</div>

			<div className="flex items-center justify-between gap-2">
				<StatusBadge kind="lead_source" status={lead.source}>
					{statusLabel('lead_source', lead.source)}
				</StatusBadge>
				<span className="shrink-0 text-[11px] text-muted-foreground">
					{formatRelative(lead.createdAt)}
				</span>
			</div>
		</div>
	);
}
