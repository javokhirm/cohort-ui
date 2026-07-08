import { Skeleton } from '@repo/ui';

const MOCK_ROLES = 4;
const MOCK_ROWS = 6;

export function MatrixSkeleton() {
	return (
		<div className="overflow-x-auto rounded-lg border border-border">
			<table className="w-full text-sm">
				<thead>
					<tr className="border-b border-border bg-muted/40">
						<th className="px-4 py-3 text-left">
							<Skeleton className="h-3 w-24" />
						</th>
						{Array.from({ length: MOCK_ROLES }, (_, i) => (
							<th key={i} className="px-4 py-3 text-center">
								<Skeleton className="mx-auto h-3 w-16" />
							</th>
						))}
					</tr>
				</thead>
				<tbody>
					{Array.from({ length: MOCK_ROWS }, (_, i) => (
						<tr key={i} className="border-b border-border">
							<td className="px-4 py-3">
								<Skeleton className="mb-1.5 h-3.5 w-40" />
								<Skeleton className="h-3 w-24" />
							</td>
							{Array.from({ length: MOCK_ROLES }, (_, j) => (
								<td key={j} className="px-4 py-3 text-center">
									<Skeleton className="mx-auto size-4 rounded" />
								</td>
							))}
						</tr>
					))}
				</tbody>
			</table>
		</div>
	);
}
