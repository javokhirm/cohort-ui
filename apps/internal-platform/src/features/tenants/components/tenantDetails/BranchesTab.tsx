import { Button, Card, DataTable, StatusBadge, type ColumnDef } from '@repo/ui';

import type { TenantBranchView } from '@/api/tenants/types';
import { useAppT } from '@/locales';

/**
 * Built per render rather than held at module scope: the headers are
 * user-facing, so they must re-resolve when the language changes.
 */
function buildColumns(
	t: ReturnType<typeof useAppT<'tenants'>>,
): ColumnDef<TenantBranchView>[] {
	return [
		{
			id: 'branch',
			header: t('column.branch'),
			cell: ({ row }) => {
				const branch = row.original;
				return (
					<>
						<div className="flex items-center gap-1.5">
							<span className="font-medium">{branch.name}</span>
							{branch.isMain && (
								<span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
									{t('onboarding.main')}
								</span>
							)}
						</div>
						{branch.address && (
							<p className="text-xs text-muted-foreground">
								{branch.address}
							</p>
						)}
					</>
				);
			},
		},
		{
			accessorKey: 'code',
			header: t('column.code'),
			cell: ({ getValue }) => (
				<span className="font-mono text-sm text-muted-foreground">
					{getValue<string>()}
				</span>
			),
		},
		{
			id: 'contact',
			header: t('column.contact'),
			cell: ({ row }) => (
				<span className="text-sm text-muted-foreground">
					{row.original.phone ?? row.original.email ?? '—'}
				</span>
			),
		},
		{
			id: 'status',
			header: t('column.status'),
			cell: ({ row }) => (
				<StatusBadge tone={row.original.isActive ? 'green' : 'slate'}>
					{row.original.isActive ? 'Active' : 'Inactive'}
				</StatusBadge>
			),
		},
	];
}

export function BranchesTab({ branches }: { branches: TenantBranchView[] }) {
	const t = useAppT('tenants');
	return (
		<div className="flex flex-col gap-4">
			<div className="flex justify-end">
				<Button size="sm" disabled>
					+ Add branch
				</Button>
			</div>
			<Card className="gap-0 overflow-hidden py-0">
				<DataTable
					columns={buildColumns(t)}
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
