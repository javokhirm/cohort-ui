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
							<Skeleton className="h-4 w-36" />
						</div>
					</TableCell>
					<TableCell>
						<Skeleton className="h-4 w-20" />
					</TableCell>
					<TableCell>
						<Skeleton className="h-5 w-16" />
					</TableCell>
					<TableCell className="text-right">
						<Skeleton className="ml-auto h-4 w-20" />
					</TableCell>
					<TableCell className="text-right">
						<Skeleton className="ml-auto h-4 w-20" />
					</TableCell>
					<TableCell className="text-right">
						<Skeleton className="ml-auto h-4 w-24" />
					</TableCell>
				</TableRow>
			))}
		</>
	);
}
