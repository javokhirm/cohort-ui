import { useEffect, useRef, useState } from 'react';
import { Users } from 'lucide-react';

import { isApiError } from '@repo/api-client';
import { cn, EmptyState, Skeleton, toast } from '@repo/ui';

import { useAppT } from '@/locales';

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
	const t = useAppT('leads');
	const moveStatus = useMoveLeadStatus();
	const [dragging, setDragging] = useState<{ id: number; from: LeadStatus } | null>(
		null,
	);

	const scrollRef = useRef<HTMLDivElement>(null);
	const scrollVelocity = useRef(0);

	// Native drag-and-drop doesn't auto-scroll the board, so a card being dragged
	// toward an off-screen column (e.g. Enrolled/Lost on a narrow viewport) gets
	// stuck. Track pointer proximity to the scroll edges while dragging and nudge
	// scrollLeft every frame, decoupled from how often dragover actually fires.
	useEffect(() => {
		if (!dragging) {
			scrollVelocity.current = 0;
			return;
		}
		let frame: number;
		const step = () => {
			const el = scrollRef.current;
			if (el && scrollVelocity.current !== 0) {
				el.scrollLeft += scrollVelocity.current;
			}
			frame = requestAnimationFrame(step);
		};
		frame = requestAnimationFrame(step);
		return () => cancelAnimationFrame(frame);
	}, [dragging]);

	function handleBoardDragOver(e: React.DragEvent) {
		const el = scrollRef.current;
		if (!el) return;
		const EDGE = 80;
		const MAX_SPEED = 16;
		const rect = el.getBoundingClientRect();
		const fromLeft = e.clientX - rect.left;
		const fromRight = rect.right - e.clientX;
		if (fromLeft < EDGE) {
			scrollVelocity.current = -MAX_SPEED * (1 - Math.max(fromLeft, 0) / EDGE);
		} else if (fromRight < EDGE) {
			scrollVelocity.current = MAX_SPEED * (1 - Math.max(fromRight, 0) / EDGE);
		} else {
			scrollVelocity.current = 0;
		}
	}

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
					toast.error(isApiError(err) ? err.message : t('board.moveFailed')),
			},
		);
	}

	if (isLoading && !board) {
		return <BoardSkeleton />;
	}

	if (isError && !board) {
		return (
			<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
				{t('board.loadError')}
			</div>
		);
	}

	const columns = board?.columns ?? [];
	const isEmpty = columns.length > 0 && columns.every((c) => c.total === 0);

	if (isEmpty) {
		return (
			<EmptyState
				icon={<Users />}
				title={t('board.emptyTitle')}
				description={t('board.emptyDescription')}
			/>
		);
	}

	return (
		<div
			ref={scrollRef}
			onDragOver={handleBoardDragOver}
			className="flex flex-1 items-start gap-3 overflow-x-auto pb-2"
		>
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
