import { useEffect, useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

import {
	Avatar,
	AvatarFallback,
	Badge,
	Button,
	Card,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow,
	cn,
} from '@repo/ui';

import { useUserList } from '@/features/users/hooks';
import { avatarClass, getInitials } from '@/features/users/utils';
import { TableSkeleton } from '@/features/users/components/TableSkeleton';
import { PAGE_SIZE } from '@/features/users/constants';

export function UserDirectoryPage() {
	const navigate = useNavigate();
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

	const totalPages = list ? Math.max(1, list.totalPages) : 1;
	const total = list?.total ?? 0;
	const rangeStart = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
	const rangeEnd = Math.min(page * PAGE_SIZE, total);

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
						placeholder="Search name, phone or email..."
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
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead className="w-72">User</TableHead>
							<TableHead>Phone</TableHead>
							<TableHead>Tenants</TableHead>
							<TableHead className="text-right">Count</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{isLoading ? (
							<TableSkeleton />
						) : !list || list.rows.length === 0 ? (
							<TableRow>
								<TableCell
									colSpan={4}
									className="py-16 text-center text-sm text-muted-foreground"
								>
									No users match your search.
								</TableCell>
							</TableRow>
						) : (
							list.rows.map((user) => (
								<TableRow
									key={user.id}
									className="cursor-pointer"
									onClick={() =>
										void navigate({
											to: '/users/$userId',
											params: { userId: String(user.id) },
										})
									}
								>
									<TableCell>
										<div className="flex items-center gap-3">
											<Avatar className="size-8 shrink-0">
												<AvatarFallback
													className={cn(
														'text-xs font-bold',
														avatarClass(user.id),
													)}
												>
													{getInitials(
														user.firstName,
														user.lastName,
													)}
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
									</TableCell>

									<TableCell className="text-sm tabular-nums text-muted-foreground">
										{user.phone}
									</TableCell>

									<TableCell>
										<div className="flex flex-wrap gap-1.5">
											{user.tenants.slice(0, 3).map((t) => (
												<Badge
													key={t.tenantId}
													variant="secondary"
													className="text-xs"
												>
													{t.name}
												</Badge>
											))}
											{user.tenants.length > 3 && (
												<Badge
													variant="outline"
													className="text-xs"
												>
													+{user.tenants.length - 3}
												</Badge>
											)}
										</div>
									</TableCell>

									<TableCell className="text-right text-sm font-medium tabular-nums">
										{user.membershipCount}
									</TableCell>
								</TableRow>
							))
						)}
					</TableBody>
				</Table>

				<div className="flex items-center justify-between border-t border-border px-4 py-3">
					<p className="text-xs text-muted-foreground">
						{isLoading
							? 'Loading…'
							: total === 0
								? 'No results'
								: `Showing ${rangeStart}–${rangeEnd} of ${total} users`}
					</p>

					{totalPages > 1 && (
						<div className="flex items-center gap-0.5">
							<Button
								variant="ghost"
								size="icon"
								className="size-8"
								disabled={page <= 1}
								onClick={() => handlePage(page - 1)}
							>
								<ChevronLeft className="size-4" />
							</Button>
							{Array.from({ length: totalPages }, (_, i) => (
								<Button
									key={i}
									variant={i + 1 === page ? 'default' : 'ghost'}
									size="icon"
									className="size-8 text-xs"
									onClick={() => handlePage(i + 1)}
								>
									{i + 1}
								</Button>
							))}
							<Button
								variant="ghost"
								size="icon"
								className="size-8"
								disabled={page >= totalPages}
								onClick={() => handlePage(page + 1)}
							>
								<ChevronRight className="size-4" />
							</Button>
						</div>
					)}
				</div>
			</Card>
		</div>
	);
}
