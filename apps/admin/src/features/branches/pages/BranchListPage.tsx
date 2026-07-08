import { useState } from 'react';
import { Plus } from 'lucide-react';

import { Button, PageHeader, Spinner } from '@repo/ui';

import { Can } from '@/components/Can';
import { useBranches, type Branch } from '@/api/branches';

import { BranchCard } from '../components/BranchCard';
import { BranchForm } from '../components/BranchForm';

export function BranchListPage() {
	const { data: branches, isLoading, isError } = useBranches();

	const [addOpen, setAddOpen] = useState(false);
	const [editBranch, setEditBranch] = useState<Branch | null>(null);

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-6">
			<PageHeader
				title="Branches"
				description="Physical campuses — addresses, contacts and capacity"
				actions={
					<Can permission="branch.create">
						<Button onClick={() => setAddOpen(true)}>
							<Plus className="mr-1.5 size-4" />
							Add branch
						</Button>
					</Can>
				}
			/>

			{isError && (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					Failed to load branches. Please refresh.
				</div>
			)}

			{isLoading ? (
				<div className="flex items-center justify-center py-16 text-muted-foreground">
					<Spinner className="size-5" />
				</div>
			) : branches && branches.length > 0 ? (
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
					{branches.map((branch) => (
						<BranchCard
							key={branch.id}
							branch={branch}
							onEdit={setEditBranch}
						/>
					))}
				</div>
			) : (
				!isError && (
					<div className="rounded-lg border border-dashed border-border py-16 text-center text-sm text-muted-foreground">
						No branches yet. Add your first campus to get started.
					</div>
				)
			)}

			<BranchForm mode="create" open={addOpen} onOpenChange={setAddOpen} />
			{editBranch && (
				<BranchForm
					mode="edit"
					branch={editBranch}
					open={editBranch !== null}
					onOpenChange={(open) => {
						if (!open) setEditBranch(null);
					}}
				/>
			)}
		</div>
	);
}
