import { useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Plus } from 'lucide-react';

import { Button, Card, PageHeader, Pagination, SearchFilterBar } from '@repo/ui';

import { Can } from '@/components/Can';
import { useCourseList } from '../api/courses.queries';
import type { CourseListFilters } from '../api/keys';
import { COURSE_STATUS_FILTERS } from '../lib/course-options';
import { CourseTable } from '../components/CourseTable';
import { CourseForm } from '../components/CourseForm';

const PAGE_SIZE = 20;

export function CourseListPage() {
	const navigate = useNavigate({ from: '/courses' });
	const {
		page = 1,
		search: searchParam,
		status,
	} = useSearch({ from: '/_authed/courses' });

	const [inputValue, setInputValue] = useState(searchParam ?? '');
	const [addOpen, setAddOpen] = useState(false);

	useEffect(() => {
		// Keep the box in sync when the URL search param is cleared/changed externally
		// (e.g. navigating via the sidebar). Mirrors the staff list convention.
		// eslint-disable-next-line react-hooks/set-state-in-effect
		setInputValue(searchParam ?? '');
	}, [searchParam]);

	useEffect(() => {
		const timer = setTimeout(() => {
			const trimmed = inputValue.trim() || undefined;
			if (trimmed === (searchParam || undefined)) return;
			void navigate({
				search: (prev) => ({ ...prev, search: trimmed, page: undefined }),
			});
		}, 350);
		return () => clearTimeout(timer);
	}, [inputValue]); // eslint-disable-line react-hooks/exhaustive-deps

	const filters: CourseListFilters = {
		page,
		limit: PAGE_SIZE,
		search: searchParam || undefined,
		isActive: status === undefined ? undefined : status === 'active',
	};

	const { data, isLoading, isError } = useCourseList(filters);
	const courses = data?.rows ?? [];
	const total = data?.total ?? 0;

	function handleStatusChange(value: (typeof COURSE_STATUS_FILTERS)[number]['value']) {
		void navigate({
			search: (prev) => ({ ...prev, status: value, page: undefined }),
		});
	}

	function handlePage(newPage: number) {
		void navigate({ search: (prev) => ({ ...prev, page: newPage }) });
	}

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-6">
			<PageHeader
				title="Courses"
				description="Course catalog — levels, durations and branch scope"
				actions={
					<Can permission="course.create">
						<Button onClick={() => setAddOpen(true)}>
							<Plus className="mr-1.5 size-4" />
							New course
						</Button>
					</Can>
				}
			/>

			<div className="flex flex-col gap-4">
				<SearchFilterBar
					searchValue={inputValue}
					onSearchChange={setInputValue}
					searchPlaceholder="Search courses…"
					filters={COURSE_STATUS_FILTERS.map((f) => ({
						id: f.value ?? 'ALL',
						label: f.label,
						active: status === f.value,
						onClick: () => handleStatusChange(f.value),
					}))}
				/>

				{isError && (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						Failed to load courses. Please refresh.
					</div>
				)}

				<Card className="gap-0 overflow-hidden py-0">
					<CourseTable courses={courses} isLoading={isLoading} />
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

			<CourseForm mode="create" open={addOpen} onOpenChange={setAddOpen} />
		</div>
	);
}
