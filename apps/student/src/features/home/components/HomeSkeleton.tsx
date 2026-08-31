import { Skeleton } from '@repo/ui';

/**
 * Home's loading state, shaped like what replaces it — the hero, the momentum
 * pair, a standing card and the timeline — so the screen settles instead of
 * reflowing when `GET /student/home` lands. Mirrors the two-column split the real
 * screen takes from `lg` up, and the `rounded-xl` every card on it wears.
 */
export function HomeSkeleton() {
	return (
		<div className="mx-auto w-full max-w-200 pb-8 lg:max-w-5xl">
			<div className="flex flex-col gap-4 lg:grid lg:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)] lg:items-start lg:gap-5">
				<div className="flex flex-col gap-4">
					<Skeleton className="h-52 w-full rounded-xl" />
					<div className="flex flex-col gap-3">
						<div className="flex items-center gap-2">
							<Skeleton className="size-8 rounded-lg" />
							<Skeleton className="h-6 w-28 rounded-lg" />
						</div>
						<Skeleton className="h-44 w-full rounded-xl" />
					</div>
				</div>
				<div className="flex flex-col gap-4">
					{/* Two columns, matching `HomeStats` — streak and attendance rate. */}
					<div className="grid grid-cols-2 gap-3">
						<Skeleton className="h-34 rounded-xl" />
						<Skeleton className="h-34 rounded-xl" />
					</div>
					<Skeleton className="h-22 w-full rounded-xl" />
					<Skeleton className="h-30 w-full rounded-xl" />
				</div>
			</div>
		</div>
	);
}
