import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Plus } from 'lucide-react';

import { Button, PageHeader } from '@repo/ui';

import { Can } from '@/components/Can';
import { useAppT } from '@/locales';
import { useBranches } from '@/api/branches';
import { useActiveBranchIds } from '@/store/branchStore';

import type { LeadListFilters } from '../api/keys';
import { useLeadBoard } from '../api/leads.queries';
import { windowToCreatedAfter } from '../lib/lead-options';
import { AddLeadSheet } from '../components/AddLeadSheet';
import { LeadBoard } from '../components/LeadBoard';
import { LeadDetailSheet } from '../components/LeadDetailSheet';
import { LeadFilters, type LeadFilterValues } from '../components/LeadFilters';

export function LeadPipelinePage() {
	const t = useAppT('leads');
	const navigate = useNavigate({ from: '/leads' });
	const search = useSearch({ from: '/_authed/leads' });
	const activeBranchIds = useActiveBranchIds();
	const { data: branches = [] } = useBranches();

	const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);
	const [addOpen, setAddOpen] = useState(false);

	const filters: LeadListFilters = {
		source: search.source,
		assignedToStaffId: search.assignedToStaffId,
		courseInterestId: search.courseInterestId,
		search: search.search,
		createdAfter: windowToCreatedAfter(search.window),
	};

	const { data: board, isLoading, isError } = useLeadBoard(filters);
	const totalLeads = board?.columns.reduce((sum, c) => sum + c.total, 0) ?? 0;

	const scopeLabel = !activeBranchIds
		? t('scopeAllBranches')
		: activeBranchIds.length === 1
			? (branches.find((b) => b.id === activeBranchIds[0])?.name ??
				t('scopeBranches', { count: 1 }))
			: t('scopeBranches', { count: activeBranchIds.length });

	const filterValues: LeadFilterValues = {
		search: search.search,
		source: search.source,
		assignedToStaffId: search.assignedToStaffId,
		courseInterestId: search.courseInterestId,
		window: search.window,
	};

	function handleFilterChange(patch: Partial<LeadFilterValues>) {
		void navigate({ search: (prev) => ({ ...prev, ...patch }) });
	}

	function handleClear() {
		void navigate({ search: () => ({}) });
	}

	return (
		<div className="mx-auto flex h-full w-full max-w-[1400px] flex-col gap-5">
			<PageHeader
				title={t('title')}
				description={t('headerDescription', {
					scope: scopeLabel,
					leads: t('leadCount', { count: totalLeads }),
				})}
				actions={
					<Can permission="lead.create">
						<Button onClick={() => setAddOpen(true)}>
							<Plus className="mr-1.5 size-4" />
							{t('add')}
						</Button>
					</Can>
				}
			/>

			<LeadFilters
				values={filterValues}
				onChange={handleFilterChange}
				onClear={handleClear}
			/>

			<div className="min-h-0 max-h-screen flex-1">
				<LeadBoard
					board={board}
					isLoading={isLoading}
					isError={isError}
					filters={filters}
					onOpenLead={setSelectedLeadId}
				/>
			</div>

			<LeadDetailSheet
				leadId={selectedLeadId}
				open={selectedLeadId != null}
				onOpenChange={(open) => {
					if (!open) setSelectedLeadId(null);
				}}
			/>
			<AddLeadSheet open={addOpen} onOpenChange={setAddOpen} />
		</div>
	);
}
