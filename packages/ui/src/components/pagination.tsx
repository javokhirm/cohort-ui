import * as React from 'react';
import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';

import { cn } from '../lib/utils';
import { Button } from './button';

type PageItem = number | 'ellipsis-left' | 'ellipsis-right';

function range(start: number, end: number): number[] {
	return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}

/** Page numbers to render, with ellipsis tokens, given the current page + total. */
function getPageItems(
	page: number,
	totalPages: number,
	siblingCount: number,
): PageItem[] {
	const totalSlots = siblingCount * 2 + 5; // first, last, current, 2x siblings, 2 ellipses
	if (totalPages <= totalSlots) {
		return range(1, totalPages);
	}

	const leftSibling = Math.max(page - siblingCount, 1);
	const rightSibling = Math.min(page + siblingCount, totalPages);
	const showLeftEllipsis = leftSibling > 2;
	const showRightEllipsis = rightSibling < totalPages - 1;

	if (!showLeftEllipsis && showRightEllipsis) {
		return [...range(1, 3 + siblingCount * 2), 'ellipsis-right', totalPages];
	}
	if (showLeftEllipsis && !showRightEllipsis) {
		return [
			1,
			'ellipsis-left',
			...range(totalPages - (2 + siblingCount * 2), totalPages),
		];
	}
	return [
		1,
		'ellipsis-left',
		...range(leftSibling, rightSibling),
		'ellipsis-right',
		totalPages,
	];
}

interface PaginationProps extends Omit<React.ComponentProps<'nav'>, 'onChange'> {
	/** 1-based current page. */
	page: number;
	/** Rows per page. */
	pageSize: number;
	/** Total row count (from the list envelope's `meta.total`). */
	total: number;
	onPageChange: (page: number) => void;
	/** How many page buttons to show on each side of the current page. */
	siblingCount?: number;
	/** Show the "Showing X–Y of N" range label. */
	showRange?: boolean;
}

/**
 * Offset-pagination control for server-paginated lists (the API model in
 * api-integration.md). Pair with `DataTable` and the `PaginatedResult` meta.
 */
function Pagination({
	className,
	page,
	pageSize,
	total,
	onPageChange,
	siblingCount = 1,
	showRange = true,
	...props
}: PaginationProps) {
	const totalPages = Math.max(1, Math.ceil(total / pageSize));
	const current = Math.min(Math.max(page, 1), totalPages);
	const from = total === 0 ? 0 : (current - 1) * pageSize + 1;
	const to = Math.min(current * pageSize, total);
	const items = getPageItems(current, totalPages, siblingCount);

	return (
		<nav
			data-slot="pagination"
			role="navigation"
			aria-label="Pagination"
			className={cn(
				'flex flex-col items-center justify-between gap-3 sm:flex-row',
				className,
			)}
			{...props}
		>
			{showRange && (
				<p className="text-xs text-muted-foreground tabular-nums">
					{total === 0 ? 'No results' : `Showing ${from}–${to} of ${total}`}
				</p>
			)}

			{totalPages > 1 && (
				<div className="flex items-center gap-1">
					<Button
						variant="outline"
						size="icon"
						className="size-8"
						aria-label="Previous page"
						disabled={current <= 1}
						onClick={() => onPageChange(current - 1)}
					>
						<ChevronLeft />
					</Button>

					{items.map((item) =>
						typeof item === 'number' ? (
							<Button
								key={item}
								variant={item === current ? 'default' : 'outline'}
								size="icon"
								className="size-8 tabular-nums"
								aria-label={`Page ${item}`}
								aria-current={item === current ? 'page' : undefined}
								onClick={() => onPageChange(item)}
							>
								{item}
							</Button>
						) : (
							<span
								key={item}
								aria-hidden
								className="flex size-8 items-center justify-center text-muted-foreground"
							>
								<MoreHorizontal className="size-4" />
							</span>
						),
					)}

					<Button
						variant="outline"
						size="icon"
						className="size-8"
						aria-label="Next page"
						disabled={current >= totalPages}
						onClick={() => onPageChange(current + 1)}
					>
						<ChevronRight />
					</Button>
				</div>
			)}
		</nav>
	);
}

export { Pagination };
export type { PaginationProps };
