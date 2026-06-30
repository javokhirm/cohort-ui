import { Card, CardContent, Skeleton } from '@repo/ui';

export function KpiSkeleton() {
	return (
		<div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
			{Array.from({ length: 6 }, (_, i) => (
				<Card key={i} className="py-0">
					<CardContent className="px-5 py-4">
						<Skeleton className="h-3 w-20" />
						<Skeleton className="mt-2 h-8 w-16" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}
