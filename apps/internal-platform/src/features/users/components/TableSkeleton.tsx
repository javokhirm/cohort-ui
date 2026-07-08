import { Skeleton, TableCell, TableRow } from '@repo/ui';

import { PAGE_SIZE } from '../constants';

export function TableSkeleton() {
	return (
		<>
			{Array.from({ length: PAGE_SIZE }, (_, i) => (
				<TableRow key={i}>
					<TableCell>
						<div className="flex items-center gap-3">
							<Skeleton className="size-8 rounded-full" />
							<div className="flex flex-col gap-1">
								<Skeleton className="h-4 w-32" />
								<Skeleton className="h-3 w-40" />
							</div>
						</div>
					</TableCell>
					<TableCell>
						<Skeleton className="h-4 w-28" />
					</TableCell>
					<TableCell>
						<div className="flex gap-1.5">
							<Skeleton className="h-5 w-20" />
							<Skeleton className="h-5 w-16" />
						</div>
					</TableCell>
					<TableCell className="text-right">
						<Skeleton className="ml-auto h-4 w-6" />
					</TableCell>
				</TableRow>
			))}
		</>
	);
}
