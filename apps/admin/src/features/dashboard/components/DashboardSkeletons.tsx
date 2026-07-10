import { Card, Skeleton } from '@repo/ui';

/** Placeholder for the five KPI tiles while `useDashboardStats` loads. */
export function KpiStripSkeleton() {
	return (
		<div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-5">
			{Array.from({ length: 5 }).map((_, i) => (
				<Card key={i} className="gap-0 py-0">
					<div className="flex flex-col gap-3 p-5">
						<Skeleton className="h-4 w-24" />
						<Skeleton className="h-7 w-20" />
						<Skeleton className="h-3 w-28" />
					</div>
				</Card>
			))}
		</div>
	);
}

/** Placeholder for a single trend chart while its query loads. */
export function ChartSkeleton() {
	return (
		<Card className="gap-0 py-0">
			<div className="border-b border-border px-5 py-4">
				<Skeleton className="h-4 w-32" />
				<Skeleton className="mt-2 h-3 w-24" />
			</div>
			<div className="p-5">
				<Skeleton className="h-[160px] w-full" />
			</div>
		</Card>
	);
}

/** Placeholder for a list/funnel panel while its query loads. */
export function PanelSkeleton({ rows = 3 }: { rows?: number }) {
	return (
		<Card className="gap-0 py-0">
			<div className="border-b border-border px-5 py-4">
				<Skeleton className="h-4 w-32" />
			</div>
			<div className="flex flex-col gap-4 p-5">
				{Array.from({ length: rows }).map((_, i) => (
					<div key={i} className="flex items-center justify-between gap-3">
						<Skeleton className="h-4 w-40" />
						<Skeleton className="h-4 w-16" />
					</div>
				))}
			</div>
		</Card>
	);
}
