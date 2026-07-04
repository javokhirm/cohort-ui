import { useState } from 'react';
import { Users } from 'lucide-react';

import { isApiError } from '@repo/api-client';
import { cn, EmptyState, Skeleton, toast } from '@repo/ui';

import type { LeadListFilters } from '../api/keys';
import {
	LEAD_STATUSES,
	type LeadBoard as LeadBoardType,
	type LeadCard as LeadCardType,
	type LeadStatus,
} from '../api/leads.queries';
import { useMoveLeadStatus } from '../api/leads.mutations';
import { canMoveLead } from '../lib/lead-options';
import { LeadColumn } from './LeadColumn';

interface LeadBoardProps {
	board: LeadBoardType | undefined;
	isLoading: boolean;
	isError: boolean;
	filters: LeadListFilters;
	onOpenLead: (id: number) => void;
}

/** The Kanban pipeline: five columns, native drag-and-drop stage moves. */
export function LeadBoard({
	board,
	isLoading,
	isError,
	filters,
	onOpenLead,
}: LeadBoardProps) {
	const moveStatus = useMoveLeadStatus();
	const [dragging, setDragging] = useState<{ id: number; from: LeadStatus } | null>(
		null,
	);

	// Re-key columns on a filter change so their "load more" expansion resets.
	const filterKey = JSON.stringify([
		filters.source ?? null,
		filters.assignedToStaffId ?? null,
		filters.courseInterestId ?? null,
		filters.search ?? null,
		filters.createdAfter ?? null,
		filters.branchIds ?? null,
	]);

	function handleDrop(target: LeadStatus) {
		if (!dragging) return;
		const { id, from } = dragging;
		setDragging(null);
		if (!canMoveLead(from, target)) return;
		moveStatus.mutate(
			{ id, status: target },
			{
				onError: (err) =>
					toast.error(
						isApiError(err) ? err.message : 'Could not move the lead.',
					),
			},
		);
	}

	if (isLoading && !board) {
		return <BoardSkeleton />;
	}

	if (isError && !board) {
		return (
			<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
				Failed to load the pipeline. Please refresh.
			</div>
		);
	}

	const columns = board?.columns ?? [];
	const isEmpty = columns.length > 0 && columns.every((c) => c.total === 0);

	if (isEmpty) {
		return (
			<EmptyState
				icon={<Users />}
				title="No leads match your filters."
				description="Try clearing a filter or capture a new lead to start the pipeline."
			/>
		);
	}

	return (
		<div className="flex flex-1 items-start gap-3 overflow-x-auto pb-2">
			{columns.map((col) => (
				<LeadColumn
					key={`${col.status}:${filterKey}`}
					status={col.status}
					total={col.total}
					boardItems={col.items}
					filters={filters}
					draggingId={dragging?.id ?? null}
					draggingFrom={dragging?.from ?? null}
					onOpenLead={onOpenLead}
					onDragStartLead={(lead: LeadCardType) =>
						setDragging({ id: lead.id, from: lead.status })
					}
					onDragEndLead={() => setDragging(null)}
					onDropLead={handleDrop}
				/>
			))}
		</div>
	);
}

function BoardSkeleton() {
	return (
		<div className="flex items-start gap-3 overflow-x-auto pb-2">
			{LEAD_STATUSES.map((status) => (
				<div
					key={status}
					className={cn(
						'flex w-67 shrink-0 flex-col rounded-xl border border-border bg-muted/40',
					)}
				>
					<div className="border-b border-border px-3.5 py-3">
						<Skeleton className="h-4 w-24" />
					</div>
					<div className="flex flex-col gap-2.5 p-2.5">
						<Skeleton className="h-20 w-full" />
						<Skeleton className="h-20 w-full" />
					</div>
				</div>
			))}
		</div>
	);
}
