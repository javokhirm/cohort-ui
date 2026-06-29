import * as React from 'react';
import { Search } from 'lucide-react';
import { cn } from '@repo/ui/lib/utils';

export interface FilterChip {
	id: string;
	label: string;
	count?: number;
	active?: boolean;
	onClick?: () => void;
}

interface SearchFilterBarProps extends React.ComponentProps<'div'> {
	searchValue?: string;
	onSearchChange?: (value: string) => void;
	searchPlaceholder?: string;
	filters?: FilterChip[];
	/** Right-aligned extras (e.g. an Export button). */
	actions?: React.ReactNode;
}

/**
 * Horizontal toolbar combining a search box and status/category filter chips.
 * Used in the student list, staff list, tenant directory, and invoice list.
 */
function SearchFilterBar({
	className,
	searchValue,
	onSearchChange,
	searchPlaceholder = 'Search…',
	filters,
	actions,
	...props
}: SearchFilterBarProps) {
	return (
		<div
			data-slot="search-filter-bar"
			className={cn('flex flex-wrap items-center gap-2', className)}
			{...props}
		>
			{onSearchChange !== undefined && (
				<div className="flex h-9 min-w-[200px] items-center gap-2 rounded-xl border border-border bg-card px-3">
					<Search className="size-4 shrink-0 text-muted-foreground" />
					<input
						type="text"
						value={searchValue ?? ''}
						onChange={(e) => onSearchChange(e.target.value)}
						placeholder={searchPlaceholder}
						className="min-w-0 flex-1 bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
					/>
				</div>
			)}
			{filters && (
				<div className="flex flex-wrap items-center gap-1.5">
					{filters.map((f) => (
						<button
							key={f.id}
							type="button"
							onClick={f.onClick}
							className={cn(
								'flex h-8 items-center gap-1.5 rounded-xl border px-3 text-xs font-semibold transition-colors',
								f.active
									? 'border-primary bg-primary/10 text-primary'
									: 'border-border bg-card text-muted-foreground hover:bg-muted',
							)}
						>
							{f.label}
							{f.count !== undefined && (
								<span className="text-[10px] opacity-60">{f.count}</span>
							)}
						</button>
					))}
				</div>
			)}
			{actions && <div className="ml-auto flex items-center gap-2">{actions}</div>}
		</div>
	);
}

export { SearchFilterBar };
export type { SearchFilterBarProps };
