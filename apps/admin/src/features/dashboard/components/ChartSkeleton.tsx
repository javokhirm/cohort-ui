import { Card, CardContent, CardHeader, Skeleton } from '@repo/ui';

export function ChartSkeleton() {
	return (
		<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
			{Array.from({ length: 3 }, (_, i) => (
				<Card key={i} className="gap-0 py-0">
					<CardHeader className="border-b border-border px-5 py-4">
						<Skeleton className="h-4 w-28" />
					</CardHeader>
					<CardContent className="flex items-center justify-center px-2 py-4">
						<Skeleton className="h-45 w-full" />
					</CardContent>
				</Card>
			))}
		</div>
	);
}
