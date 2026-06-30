import { Skeleton } from '@repo/ui';

export function DetailSkeleton() {
	return (
		<div className="flex flex-col gap-6">
			<Skeleton className="h-4 w-24" />
			<div className="flex flex-col gap-2">
				{Array.from({ length: 5 }, (_, i) => (
					<Skeleton key={i} className="h-10 w-full rounded-lg" />
				))}
			</div>
		</div>
	);
}
