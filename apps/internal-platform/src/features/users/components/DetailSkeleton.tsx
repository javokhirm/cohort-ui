import { Skeleton } from '@repo/ui';

export function DetailSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<Skeleton className="h-4 w-32" />
			<div className="flex items-center gap-4">
				<Skeleton className="size-12 rounded-full" />
				<div className="flex flex-col gap-2">
					<Skeleton className="h-6 w-48" />
					<Skeleton className="h-4 w-64" />
				</div>
			</div>
			<div className="flex flex-col gap-2">
				<Skeleton className="h-3 w-40" />
				{Array.from({ length: 2 }, (_, i) => (
					<Skeleton key={i} className="h-16 w-full rounded-lg" />
				))}
			</div>
		</div>
	);
}
