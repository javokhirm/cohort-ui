import * as React from 'react';
import {
	flexRender,
	getCoreRowModel,
	getSortedRowModel,
	useReactTable,
	type ColumnDef,
	type OnChangeFn,
	type RowSelectionState,
	type SortingState,
	type VisibilityState,
} from '@tanstack/react-table';
import { ChevronDown, ChevronUp, ChevronsUpDown } from 'lucide-react';

import { cn } from '../lib/utils';
import { EmptyState } from './empty-state';
import { Skeleton } from './skeleton';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './table';

interface DataTableProps<TData, TValue> {
	columns: ColumnDef<TData, TValue>[];
	data: TData[];
	/** Show shimmer rows instead of data (initial load). */
	isLoading?: boolean;
	/** Controlled sorting state (drives sort indicators). */
	sorting?: SortingState;
	onSortingChange?: OnChangeFn<SortingState>;
	/** Controlled row selection. Providing `onRowSelectionChange` enables selection. */
	rowSelection?: RowSelectionState;
	onRowSelectionChange?: OnChangeFn<RowSelectionState>;
	/** Controlled column visibility. */
	columnVisibility?: VisibilityState;
	onColumnVisibilityChange?: OnChangeFn<VisibilityState>;
	/** Stable row id (use the backend id, not the array index, for selection). */
	getRowId?: (originalRow: TData, index: number) => string;
	/** Default `true`: sorting is delegated to the server (state → URL → refetch). */
	manualSorting?: boolean;
	onRowClick?: (row: TData) => void;
	/** Rendered when there are no rows and not loading. */
	emptyState?: React.ReactNode;
	skeletonRows?: number;
	className?: string;
}

function DataTable<TData, TValue>({
	columns,
	data,
	isLoading = false,
	sorting,
	onSortingChange,
	rowSelection,
	onRowSelectionChange,
	columnVisibility,
	onColumnVisibilityChange,
	getRowId,
	manualSorting = true,
	onRowClick,
	emptyState,
	skeletonRows = 8,
	className,
}: DataTableProps<TData, TValue>) {
	const table = useReactTable({
		data,
		columns,
		state: { sorting, rowSelection: rowSelection ?? {}, columnVisibility },
		getRowId,
		manualSorting,
		enableRowSelection: !!onRowSelectionChange,
		onSortingChange,
		onRowSelectionChange,
		onColumnVisibilityChange,
		getCoreRowModel: getCoreRowModel(),
		getSortedRowModel: manualSorting ? undefined : getSortedRowModel(),
	});

	const colCount = table.getVisibleLeafColumns().length || columns.length;

	return (
		<div
			data-slot="data-table"
			className={cn('rounded-xl border border-border bg-card', className)}
		>
			<Table>
				<TableHeader>
					{table.getHeaderGroups().map((headerGroup) => (
						<TableRow key={headerGroup.id} className="hover:bg-transparent">
							{headerGroup.headers.map((header) => {
								const canSort = header.column.getCanSort();
								const sorted = header.column.getIsSorted();
								return (
									<TableHead key={header.id} colSpan={header.colSpan}>
										{header.isPlaceholder ? null : canSort ? (
											<button
												type="button"
												onClick={header.column.getToggleSortingHandler()}
												className="-mx-1 inline-flex items-center gap-1 rounded px-1 hover:text-foreground focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40"
											>
												{flexRender(
													header.column.columnDef.header,
													header.getContext(),
												)}
												{sorted === 'asc' ? (
													<ChevronUp className="size-3.5" />
												) : sorted === 'desc' ? (
													<ChevronDown className="size-3.5" />
												) : (
													<ChevronsUpDown className="size-3.5 opacity-50" />
												)}
											</button>
										) : (
											flexRender(
												header.column.columnDef.header,
												header.getContext(),
											)
										)}
									</TableHead>
								);
							})}
						</TableRow>
					))}
				</TableHeader>

				<TableBody>
					{isLoading ? (
						Array.from({ length: skeletonRows }).map((_, rowIndex) => (
							<TableRow
								key={`skeleton-${rowIndex}`}
								className="hover:bg-transparent"
							>
								{Array.from({ length: colCount }).map((__, cellIndex) => (
									<TableCell key={`skeleton-${rowIndex}-${cellIndex}`}>
										<Skeleton className="h-4 w-full max-w-32" />
									</TableCell>
								))}
							</TableRow>
						))
					) : table.getRowModel().rows.length === 0 ? (
						<TableRow className="hover:bg-transparent">
							<TableCell colSpan={colCount} className="p-0">
								{emptyState ?? (
									<EmptyState
										title="No results"
										description="There's nothing to show here yet."
									/>
								)}
							</TableCell>
						</TableRow>
					) : (
						table.getRowModel().rows.map((row) => (
							<TableRow
								key={row.id}
								data-state={row.getIsSelected() && 'selected'}
								onClick={
									onRowClick
										? () => onRowClick(row.original)
										: undefined
								}
								className={cn(onRowClick && 'cursor-pointer')}
							>
								{row.getVisibleCells().map((cell) => (
									<TableCell key={cell.id}>
										{flexRender(
											cell.column.columnDef.cell,
											cell.getContext(),
										)}
									</TableCell>
								))}
							</TableRow>
						))
					)}
				</TableBody>
			</Table>
		</div>
	);
}

export { DataTable };
export type { DataTableProps };
export type {
	ColumnDef,
	SortingState,
	RowSelectionState,
	VisibilityState,
} from '@tanstack/react-table';
