import { Button, Card, DataTable, StatusBadge, type ColumnDef } from '@repo/ui';

import type { TenantBranchView } from '@/api/tenants/types';

const columns: ColumnDef<TenantBranchView>[] = [
	{
		id: 'branch',
		header: 'Branch',
		cell: ({ row }) => {
			const branch = row.original;
			return (
				<>
					<div className="flex items-center gap-1.5">
						<span className="font-medium">{branch.name}</span>
						{branch.isMain && (
							<span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
								Main
							</span>
						)}
					</div>
					{branch.address && (
						<p className="text-xs text-muted-foreground">{branch.address}</p>
					)}
				</>
			);
		},
	},
	{
		accessorKey: 'code',
		header: 'Code',
		cell: ({ getValue }) => (
			<span className="font-mono text-sm text-muted-foreground">
				{getValue<string>()}
			</span>
		),
	},
	{
		id: 'contact',
		header: 'Contact',
		cell: ({ row }) => (
			<span className="text-sm text-muted-foreground">
				{row.original.phone ?? row.original.email ?? '—'}
			</span>
		),
	},
	{
		id: 'status',
		header: 'Status',
		cell: ({ row }) => (
			<StatusBadge tone={row.original.isActive ? 'green' : 'slate'}>
				{row.original.isActive ? 'Active' : 'Inactive'}
			</StatusBadge>
		),
	},
];

export function BranchesTab({ branches }: { branches: TenantBranchView[] }) {
	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-end">
				<Button size="sm" disabled>
					+ Add branch
				</Button>
			</div>
			<Card className="gap-0 overflow-hidden py-0">
				<DataTable
					columns={columns}
					data={branches}
					getRowId={(row) => String(row.id)}
					emptyState={
						<div className="py-16 text-center text-sm text-muted-foreground">
							No branches found.
						</div>
					}
					className="rounded-none border-0"
				/>
			</Card>
		</div>
	);
}
