import { useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';

import { ConfirmDialog, PageHeader, Pagination, SearchFilterBar, toast } from '@repo/ui';
import { isApiError } from '@repo/api-client';

import { useAppT } from '@/locales';
import { useGuardians, type GuardianCandidate } from '../api/guardians.queries';
import { useDeleteGuardian } from '../api/guardians.mutations';
import type { GuardianListFilters } from '../api/keys';
import { GuardianTable } from '../components/GuardianTable';
import { GuardianDetailSheet } from '../components/GuardianDetailSheet';

const PAGE_SIZE = 20;

export function GuardianListPage() {
	const t = useAppT('people');
	const navigate = useNavigate({ from: '/guardians' });
	const { page = 1, search = '' } = useSearch({ from: '/_authed/guardians' });

	// The input stays local and is debounced into the URL, same convention as
	// the Students list — a filtered page is shareable, and Back should land on
	// the exact search the admin left rather than a blank list.
	const [inputValue, setInputValue] = useState(search);
	const [selectedGuardianId, setSelectedGuardianId] = useState<number | null>(null);
	const [sheetMode, setSheetMode] = useState<'view' | 'edit'>('view');
	const [deleteTarget, setDeleteTarget] = useState<GuardianCandidate | null>(null);
	const deleteGuardian = useDeleteGuardian();

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

	const filters: GuardianListFilters = {
		page,
		limit: PAGE_SIZE,
		search: search || undefined,
	};

	const { data, isLoading } = useGuardians(filters);
	const guardians = data?.rows ?? [];
	const total = data?.total ?? 0;

	function handlePageChange(next: number) {
		void navigate({ search: (prev) => ({ ...prev, page: next }) });
	}

	function handleDeleteConfirm() {
		if (!deleteTarget) return;
		deleteGuardian.mutate(deleteTarget.user.id, {
			onSuccess: () => {
				toast.success(t('guardiansPage.detail.deleted'));
				setDeleteTarget(null);
			},
			onError: (err) =>
				toast.error(
					isApiError(err) ? err.message : t('guardiansPage.detail.deleteFailed'),
				),
		});
	}

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-6">
			<PageHeader
				title={t('guardiansPage.title')}
				description={t('guardiansPage.description')}
			/>

			<div className="flex flex-col gap-4">
				<SearchFilterBar
					searchValue={inputValue}
					onSearchChange={setInputValue}
					searchPlaceholder={t('guardiansPage.searchPlaceholder')}
				/>

				<div className="overflow-hidden rounded-xl border border-border bg-card">
					<GuardianTable
						guardians={guardians}
						isLoading={isLoading}
						onRowClick={(guardian) => {
							setSheetMode('view');
							setSelectedGuardianId(guardian.user.id);
						}}
						onEdit={(guardian) => {
							setSheetMode('edit');
							setSelectedGuardianId(guardian.user.id);
						}}
						onDelete={setDeleteTarget}
					/>
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

			<GuardianDetailSheet
				guardianId={selectedGuardianId}
				initialMode={sheetMode}
				open={selectedGuardianId != null}
				onOpenChange={(open) => {
					if (!open) setSelectedGuardianId(null);
				}}
			/>

			<ConfirmDialog
				open={deleteTarget != null}
				onOpenChange={(open) => {
					if (!open) setDeleteTarget(null);
				}}
				title={t('guardiansPage.detail.deleteConfirmTitle')}
				description={t('guardiansPage.detail.deleteConfirmDescription', {
					name: deleteTarget
						? `${deleteTarget.user.firstName} ${deleteTarget.user.lastName}`.trim()
						: '',
				})}
				confirmLabel={t('guardiansPage.detail.delete')}
				variant="destructive"
				loading={deleteGuardian.isPending}
				onConfirm={handleDeleteConfirm}
			/>
		</div>
	);
}
