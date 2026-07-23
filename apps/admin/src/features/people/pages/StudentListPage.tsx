import { useState } from 'react';

import { Button, PageHeader, Pagination, SearchFilterBar } from '@repo/ui';
import { useStatusLabel, useT } from '@repo/i18n';
import { Download, Plus } from 'lucide-react';

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
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE');
	const [search, setSearch] = useState('');
	const [page, setPage] = useState(1);
	const [addOpen, setAddOpen] = useState(false);

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
		setStatusFilter(value);
		setPage(1);
	}

	function handleSearchChange(value: string) {
		setSearch(value);
		setPage(1);
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
					searchValue={search}
					onSearchChange={handleSearchChange}
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
					actions={
						<Button variant="outline" size="sm" disabled>
							<Download className="mr-1.5 size-4" />
							{t('export')}
						</Button>
					}
				/>

				<div className="overflow-hidden rounded-xl border border-border bg-card">
					<StudentTable students={students} isLoading={isLoading} />
					<div className="border-t px-4 py-3">
						<Pagination
							page={page}
							pageSize={PAGE_SIZE}
							total={total}
							onPageChange={setPage}
						/>
					</div>
				</div>
			</div>

			<StudentForm mode="create" open={addOpen} onOpenChange={setAddOpen} />
		</div>
	);
}
