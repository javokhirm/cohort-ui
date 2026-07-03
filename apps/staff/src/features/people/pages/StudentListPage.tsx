import { useState } from 'react';

import { Button, PageHeader, Pagination, SearchFilterBar } from '@repo/ui';
import { Download, Plus } from 'lucide-react';

import { Can } from '@/components/Can';
import { getTenantSlug } from '@/lib/tenant';
import { useStudents } from '../api/students.queries';
import type { StudentListFilters } from '../api/keys';
import { StudentTable } from '../components/StudentTable';
import { StudentForm } from '../components/StudentForm';

type StatusFilter = 'ALL' | 'ACTIVE' | 'INACTIVE' | 'GRADUATED' | 'SUSPENDED';

const STATUS_TABS: { value: StatusFilter; label: string }[] = [
	{ value: 'ALL', label: 'All' },
	{ value: 'ACTIVE', label: 'Active' },
	{ value: 'INACTIVE', label: 'Inactive' },
	{ value: 'GRADUATED', label: 'Graduated' },
	{ value: 'SUSPENDED', label: 'Suspended' },
];

const PAGE_SIZE = 20;

export function StudentListPage() {
	const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE');
	const [search, setSearch] = useState('');
	const [page, setPage] = useState(1);
	const [addOpen, setAddOpen] = useState(false);

	const tenantSlug = getTenantSlug();
	const tenantName = tenantSlug
		? tenantSlug.charAt(0).toUpperCase() + tenantSlug.slice(1)
		: null;

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
				title="Students"
				description={
					tenantName
						? `${tenantName} · manage student records, enrollments and balances`
						: 'Manage student records, enrollments and balances'
				}
				actions={
					<Can permission="student.create">
						<Button onClick={() => setAddOpen(true)}>
							<Plus className="mr-1.5 size-4" />
							Add student
						</Button>
					</Can>
				}
			/>

			<div className="flex flex-col gap-4">
				<SearchFilterBar
					searchValue={search}
					onSearchChange={handleSearchChange}
					searchPlaceholder="Search name or code..."
					filters={STATUS_TABS.map((tab) => ({
						id: tab.value,
						label: tab.label,
						active: statusFilter === tab.value,
						onClick: () => handleStatusChange(tab.value),
					}))}
					actions={
						<Button variant="outline" size="sm" disabled>
							<Download className="mr-1.5 size-4" />
							Export
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
