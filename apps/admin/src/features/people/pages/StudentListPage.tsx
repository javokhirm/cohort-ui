import { useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';

import { Button, PageHeader, Pagination, SearchFilterBar } from '@repo/ui';
import { useStatusLabel, useT } from '@repo/i18n';
import { Plus } from 'lucide-react';

import { Can } from '@/components/Can';
import { useAppT } from '@/locales';
import { useStudents } from '../api/students.queries';
import type { StudentListFilters } from '../api/keys';
import { StudentTable } from '../components/StudentTable';
import { StudentForm } from '../components/StudentForm';

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'SUSPENDED';

/** Values only — labels resolve at render so a language switch re-translates. */
const STATUS_TABS: { value: StatusFilter }[] = [
	{ value: 'ALL' },
	{ value: 'ACTIVE' },
	{ value: 'INACTIVE' },
	{ value: 'GRADUATED' },
	{ value: 'SUSPENDED' },
];

const PAGE_SIZE = 20;

export function StudentListPage() {
	const t = useAppT('people');
	const tc = useT('common');
	const statusLabel = useStatusLabel();
	const navigate = useNavigate({ from: '/students' });
	// Filters are URL state, like every other list in the console: it makes a
	// filtered page shareable, and it is what lets a student's Back control
	// return to the exact page and filter the admin left.
	const {
		page = 1,
		search = '',
		status: statusFilter = 'ACTIVE',
	} = useSearch({ from: '/_authed/students' });

	// The input stays local and is debounced into the URL. `replace`, because
	// refining a search term is not a place you navigate to: pushing would bury
	// the screen the admin came from under one entry per keystroke and leave
	// Back walking through half-typed queries.
	const [inputValue, setInputValue] = useState(search);
	const [addOpen, setAddOpen] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
			const trimmed = inputValue.trim();
			if (trimmed === search) return;
			void navigate({
				search: (prev) => ({
					...prev,
					search: trimmed || undefined,
					page: undefined,
				}),
				replace: true,
			});
		}, 350);
		return () => clearTimeout(timer);
	}, [inputValue]); // eslint-disable-line react-hooks/exhaustive-deps

	const filters: StudentListFilters = {
		page,
		limit: PAGE_SIZE,
		search: search || undefined,
		status: statusFilter === 'ALL' ? undefined : statusFilter,
	};

	const { data, isLoading } = useStudents(filters);
	const students = data?.rows ?? [];
	const total = data?.total ?? 0;

	function handleStatusChange(value: StatusFilter) {
		void navigate({
			search: (prev) => ({ ...prev, status: value, page: undefined }),
		});
	}

	function handlePageChange(next: number) {
		void navigate({ search: (prev) => ({ ...prev, page: next }) });
	}

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-6">
			<PageHeader
				title={t('title')}
				description={t('description')}
				actions={
					<Can permission="student.create">
						<Button onClick={() => setAddOpen(true)}>
							<Plus className="mr-1.5 size-4" />
							{t('add')}
						</Button>
					</Can>
				}
			/>

			<div className="flex flex-col gap-4">
				<SearchFilterBar
					searchValue={inputValue}
					onSearchChange={setInputValue}
					searchPlaceholder={t('searchPlaceholder')}
					filters={STATUS_TABS.map((tab) => ({
						id: tab.value,
						label:
							tab.value === 'ALL'
								? tc('state.all')
								: statusLabel('student', tab.value),
						active: statusFilter === tab.value,
						onClick: () => handleStatusChange(tab.value),
					}))}
				/>

				<div className="overflow-hidden rounded-xl border border-border bg-card">
					<StudentTable students={students} isLoading={isLoading} />
					<div className="border-t px-4 py-3">
						<Pagination
							page={page}
							pageSize={PAGE_SIZE}
							total={total}
							onPageChange={handlePageChange}
						/>
					</div>
				</div>
			</div>

			<StudentForm mode="create" open={addOpen} onOpenChange={setAddOpen} />
		</div>
	);
}
