import { useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { Search } from 'lucide-react';

import {
	Avatar,
	AvatarFallback,
	Badge,
	Card,
	DataTable,
	Pagination,
	cn,
	type ColumnDef,
} from '@repo/ui';

import { useUserList } from '@/features/users/hooks';
import { avatarClass, getInitials } from '@/features/users/utils';
import { PAGE_SIZE } from '@/features/users/constants';
import { useAppT } from '@/locales';

type UserRow = NonNullable<ReturnType<typeof useUserList>['data']>['rows'][number];

/**
 * Built per render rather than held at module scope: the headers are
 * user-facing, so they must re-resolve when the language changes.
 */
function buildColumns(t: ReturnType<typeof useAppT<'users'>>): ColumnDef<UserRow>[] {
	return [
		{
			id: 'user',
			header: t('column.user'),
			cell: ({ row }) => {
				const user = row.original;
				return (
					<div className="flex items-center gap-3">
						<Avatar className="size-8 shrink-0">
							<AvatarFallback
								className={cn('text-xs font-bold', avatarClass(user.id))}
							>
								{getInitials(user.firstName, user.lastName)}
							</AvatarFallback>
						</Avatar>
						<div className="flex flex-col">
							<span className="text-sm font-medium">
								{user.firstName} {user.lastName}
							</span>
							{user.email && (
								<span className="text-xs text-muted-foreground">
									{user.email}
								</span>
							)}
						</div>
					</div>
				);
			},
		},
		{
			accessorKey: 'phone',
			header: t('column.phone'),
			cell: ({ getValue }) => (
				<span className="text-sm tabular-nums text-muted-foreground">
					{getValue<string>()}
				</span>
			),
		},
		{
			id: 'tenants',
			header: t('column.tenant'),
			cell: ({ row }) => (
				<div className="flex flex-wrap gap-1.5">
					{row.original.tenants.slice(0, 3).map((t) => (
						<Badge key={t.tenantId} variant="secondary" className="text-xs">
							{t.name}
						</Badge>
					))}
					{row.original.tenants.length > 3 && (
						<Badge variant="outline" className="text-xs">
							+{row.original.tenants.length - 3}
						</Badge>
					)}
				</div>
			),
		},
		{
			accessorKey: 'membershipCount',
			header: () => <div className="text-right">Count</div>,
			cell: ({ getValue }) => (
				<div className="text-right text-sm font-medium tabular-nums">
					{getValue<number>()}
				</div>
			),
		},
	];
}

export function UserDirectoryPage() {
	const t = useAppT('users');
	const navigate = useNavigate({ from: '/users' });
	const { page = 1, search: searchParam } = useSearch({ from: '/_authed/users' });

	const [inputValue, setInputValue] = useState(searchParam ?? '');

	useEffect(() => {
		setInputValue(searchParam ?? '');
	}, [searchParam]);

	useEffect(() => {
		const timer = setTimeout(() => {
			const trimmed = inputValue.trim() || undefined;
			if (trimmed === (searchParam || undefined)) return;
			void navigate({
				search: () => ({ search: trimmed, page: undefined }),
			});
		}, 350);
		return () => clearTimeout(timer);
	}, [inputValue]); // eslint-disable-line react-hooks/exhaustive-deps

	const { data: list, isLoading, isError } = useUserList({ page, search: searchParam });

	const total = list?.total ?? 0;

	function handlePage(newPage: number) {
		void navigate({ search: (prev) => ({ ...prev, page: newPage }) });
	}

	return (
		<div className="flex flex-col gap-6">
			<div>
				<h1 className="text-xl font-semibold tracking-tight">User Directory</h1>
				<p className="text-sm text-muted-foreground">
					Every person across all tenants. A user can belong to multiple
					centers.
				</p>
			</div>

			<div className="flex items-center gap-3">
				<div className="relative w-80">
					<Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
					<input
						type="text"
						value={inputValue}
						onChange={(e) => setInputValue(e.target.value)}
						placeholder={t('searchPlaceholder')}
						className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-9 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
					/>
				</div>
				{!isLoading && (
					<span className="text-sm text-muted-foreground">
						{total} {total === 1 ? 'user' : 'users'}
					</span>
				)}
			</div>

			{isError && (
				<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
					Failed to load users. Please refresh.
				</div>
			)}

			<Card className="gap-0 overflow-hidden py-0">
				<DataTable
					columns={buildColumns(t)}
					data={list?.rows ?? []}
					isLoading={isLoading}
					getRowId={(row) => String(row.id)}
					onRowClick={(row) =>
						void navigate({
							to: '/users/$userId',
							params: { userId: String(row.id) },
						})
					}
					emptyState={
						<div className="py-16 text-center text-sm text-muted-foreground">
							No users match your search.
						</div>
					}
					className="rounded-none border-0"
				/>
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
	);
}
