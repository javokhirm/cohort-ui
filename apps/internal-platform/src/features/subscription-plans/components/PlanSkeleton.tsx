import { Card, CardContent, Skeleton } from '@repo/ui';

export function PlanSkeleton() {
	return (
		<Card className="py-0">
			<CardContent className="flex flex-col gap-5 px-6 pt-8 pb-6">
				<Skeleton className="h-6 w-28" />
				<Skeleton className="h-8 w-40" />
				<div className="flex flex-col gap-2">
					<Skeleton className="h-4 w-32" />
					<Skeleton className="h-4 w-36" />
					<Skeleton className="h-4 w-28" />
				</div>
				<Skeleton className="mt-auto h-9 w-full" />
			</CardContent>
		</Card>
	);
}
