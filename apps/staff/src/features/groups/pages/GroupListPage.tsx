import { useNavigate, useSearch } from '@tanstack/react-router';
import { Plus } from 'lucide-react';

import {
	Button,
	Card,
	PageHeader,
	Pagination,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	SearchFilterBar,
} from '@repo/ui';

import { useBranches } from '@/features/people/api/students.queries';
import { useCourseList } from '@/features/courses/api/courses.queries';

import { useGroupList } from '../api/groups.queries';
import type { GroupListFilters } from '../api/keys';
import { GROUP_STATUS_FILTERS } from '../lib/group-options';
import { GroupTable } from '../components/GroupTable';

const PAGE_SIZE = 20;
const ALL = 'all';

export function GroupListPage() {
	const navigate = useNavigate();
	const {
		page = 1,
		branchId,
		courseId,
		status,
	} = useSearch({ from: '/_authed/groups' });

	const { data: branches = [] } = useBranches();
	const { data: courseData } = useCourseList({ limit: 100, isActive: true });
	const courses = courseData?.rows ?? [];

	const filters: GroupListFilters = {
		page,
		limit: PAGE_SIZE,
		branchId,
		courseId,
		status,
	};

	const { data, isLoading, isError } = useGroupList(filters);
	const groups = data?.rows ?? [];
	const total = data?.total ?? 0;

	function setSearch(patch: Partial<GroupListFilters>) {
		void navigate({
			search: (prev) => ({ ...prev, ...patch, page: undefined }),
		});
	}

	function handlePage(newPage: number) {
		void navigate({ search: (prev) => ({ ...prev, page: newPage }) });
	}

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-6">
			<PageHeader
				title="Groups"
				description="Class groups — teacher, room, capacity and weekly schedule"
				actions={
					<Button onClick={() => void navigate({ to: '/groups/new' })}>
						<Plus className="mr-1.5 size-4" />
						Create group
					</Button>
				}
			/>

			<div className="flex flex-col gap-4">
				<SearchFilterBar
					filters={GROUP_STATUS_FILTERS.map((f) => ({
						id: f.value ?? 'ALL',
						label: f.label,
						active: status === f.value,
						onClick: () => setSearch({ status: f.value }),
					}))}
					actions={
						<div className="flex items-center gap-2">
							<Select
								value={branchId ? String(branchId) : ALL}
								onValueChange={(v) =>
									setSearch({
										branchId: v === ALL ? undefined : Number(v),
									})
								}
							>
								<SelectTrigger className="h-9 w-40" size="sm">
									<SelectValue placeholder="All branches" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={ALL}>All branches</SelectItem>
									{branches.map((b) => (
										<SelectItem key={b.id} value={String(b.id)}>
											{b.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>

							<Select
								value={courseId ? String(courseId) : ALL}
								onValueChange={(v) =>
									setSearch({
										courseId: v === ALL ? undefined : Number(v),
									})
								}
							>
								<SelectTrigger className="h-9 w-44" size="sm">
									<SelectValue placeholder="All courses" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value={ALL}>All courses</SelectItem>
									{courses.map((c) => (
										<SelectItem key={c.id} value={String(c.id)}>
											{c.name}
										</SelectItem>
									))}
								</SelectContent>
							</Select>
						</div>
					}
				/>

				{isError && (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						Failed to load groups. Please refresh.
					</div>
				)}

				<Card className="gap-0 overflow-hidden py-0">
					<GroupTable groups={groups} isLoading={isLoading} />
					<div className="border-t border-border px-4 py-3">
						<Pagination
							page={page}
							pageSize={PAGE_SIZE}
							total={total}
							onPageChange={handlePage}
						/>
					</div>
				</Card>
			</div>
		</div>
	);
}
