import { useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Plus } from 'lucide-react';

import { Button, Card, PageHeader, Pagination, SearchFilterBar } from '@repo/ui';

import { Can } from '@/components/Can';
import { useStaffList } from '../api/staff.queries';
import type { StaffListFilters } from '../api/keys';
import { ROLE_FILTERS } from '../lib/roles';
import { StaffTable } from '../components/StaffTable';
import { StaffForm } from '../components/StaffForm';

const PAGE_SIZE = 20;

export function StaffListPage() {
	const navigate = useNavigate();
	const { page = 1, search: searchParam, role } = useSearch({ from: '/_authed/staff' });

	const [inputValue, setInputValue] = useState(searchParam ?? '');
	const [addOpen, setAddOpen] = useState(false);

	useEffect(() => {
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

	const filters: StaffListFilters = {
		page,
		limit: PAGE_SIZE,
		search: searchParam || undefined,
		role,
	};

	const { data, isLoading, isError } = useStaffList(filters);
	const staff = data?.rows ?? [];
	const total = data?.total ?? 0;

	function handleRoleChange(value: (typeof ROLE_FILTERS)[number]['value']) {
		void navigate({ search: (prev) => ({ ...prev, role: value, page: undefined }) });
	}

	function handlePage(newPage: number) {
		void navigate({ search: (prev) => ({ ...prev, page: newPage }) });
	}

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-6">
			<PageHeader
				title="Staff & HR"
				description="Teachers, managers and administrators"
				actions={
					<Can permission="staff.create">
						<Button onClick={() => setAddOpen(true)}>
							<Plus className="mr-1.5 size-4" />
							Add staff member
						</Button>
					</Can>
				}
			/>

			<div className="flex flex-col gap-4">
				<SearchFilterBar
					searchValue={inputValue}
					onSearchChange={setInputValue}
					searchPlaceholder="Search staff…"
					filters={ROLE_FILTERS.map((f) => ({
						id: f.value ?? 'ALL',
						label: f.label,
						active: role === f.value,
						onClick: () => handleRoleChange(f.value),
					}))}
				/>

				{isError && (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						Failed to load staff. Please refresh.
					</div>
				)}

				<Card className="gap-0 overflow-hidden py-0">
					<StaffTable staff={staff} isLoading={isLoading} />
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

			<StaffForm mode="create" open={addOpen} onOpenChange={setAddOpen} />
		</div>
	);
}
