import { useNavigate } from '@tanstack/react-router';
import { BookOpen } from 'lucide-react';

import { DataTable, StatusBadge, type ColumnDef } from '@repo/ui';

import { useBranches } from '@/features/people/api/students.queries';

import type { CourseResponse } from '../api/courses.queries';

interface CourseTableProps {
	courses: CourseResponse[];
	isLoading?: boolean;
}

export function CourseTable({ courses, isLoading }: CourseTableProps) {
	const navigate = useNavigate();
	const { data: branches = [] } = useBranches();
	const branchName = (id: number | null) =>
		id == null ? 'Shared' : (branches.find((b) => b.id === id)?.name ?? '—');

	const columns: ColumnDef<CourseResponse>[] = [
		{
			id: 'name',
			header: 'Course',
			cell: ({ row }) => (
				<div className="flex gap-2.5">
					<span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
						<BookOpen className="size-4" />
					</span>
					<div className="flex flex-col w-36">
						<span className="font-medium">{row.original.name}</span>
						{row.original.description && (
							<span className="line-clamp-1 truncate text-xs text-muted-foreground">
								{row.original.description}
							</span>
						)}
					</div>
				</div>
			),
		},
		{
			accessorKey: 'level',
			header: 'Level',
			cell: ({ getValue }) => (
				<span className="text-sm text-muted-foreground">
					{getValue<string | null>() ?? '—'}
				</span>
			),
			size: 160,
		},
		{
			accessorKey: 'defaultDurationWeeks',
			header: 'Duration',
			cell: ({ getValue }) => {
				const weeks = getValue<number | null>();
				return (
					<span className="text-sm tabular-nums text-muted-foreground">
						{weeks == null ? '—' : `${weeks} wks`}
					</span>
				);
			},
			size: 120,
		},
		{
			id: 'branch',
			header: 'Branch',
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{branchName(row.original.branchId)}
				</span>
			),
			size: 160,
		},
		{
			accessorKey: 'isActive',
			header: 'Status',
			cell: ({ getValue }) =>
				getValue<boolean>() ? (
					<StatusBadge tone="green">Active</StatusBadge>
				) : (
					<StatusBadge tone="slate">Inactive</StatusBadge>
				),
			size: 100,
		},
	];

	return (
		<DataTable
			columns={columns}
			data={courses}
			isLoading={isLoading}
			getRowId={(row) => String(row.id)}
			onRowClick={(row) =>
				void navigate({
					to: '/courses/$courseId',
					params: { courseId: String(row.id) },
				})
			}
			emptyState={
				<div className="py-16 text-center text-sm text-muted-foreground">
					No courses match this filter.
				</div>
			}
			className="rounded-none border-0"
		/>
	);
}
