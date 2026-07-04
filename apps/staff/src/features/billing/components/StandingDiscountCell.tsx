import { useState } from 'react';

import { Button, Skeleton, StatusBadge } from '@repo/ui';
import { formatDate } from '@repo/utils';

import { useEnrollmentDiscounts } from '../api/enrollment-discounts.queries';
import { EnrollmentDiscountSheet } from './EnrollmentDiscountSheet';

interface StandingDiscountCellProps {
	enrollmentId: number;
	/** The enrollment's group name, surfaced as the manage-sheet subtitle. */
	groupName: string;
}

/**
 * The "Standing discount" enrollment-row cell: shows the enrollment's active
 * assignments as pills with a Manage link, or an Assign prompt when there are
 * none. Both open the {@link EnrollmentDiscountSheet}. Render only behind
 * `enrollment.discount.manage` — it fetches an endpoint that requires it.
 */
export function StandingDiscountCell({
	enrollmentId,
	groupName,
}: StandingDiscountCellProps) {
	const [open, setOpen] = useState(false);
	const { data: assignments = [], isLoading } = useEnrollmentDiscounts(enrollmentId);

	if (isLoading) return <Skeleton className="h-5 w-28" />;

	const hasAssignments = assignments.length > 0;

	return (
		<div className="flex flex-wrap items-center gap-2">
			{hasAssignments ? (
				<>
					<div className="flex flex-wrap gap-1">
						{assignments.map((a) => (
							<StatusBadge key={a.id} tone="violet">
								{a.discountName}
								{a.validUntil
									? ` · until ${formatDate(a.validUntil)}`
									: ''}
							</StatusBadge>
						))}
					</div>
					<Button
						variant="link"
						size="sm"
						className="h-auto p-0"
						onClick={() => setOpen(true)}
					>
						Manage
					</Button>
				</>
			) : (
				<>
					<span className="text-sm text-muted-foreground">—</span>
					<Button
						variant="link"
						size="sm"
						className="h-auto p-0"
						onClick={() => setOpen(true)}
					>
						+ Assign
					</Button>
				</>
			)}

			<EnrollmentDiscountSheet
				open={open}
				onOpenChange={setOpen}
				enrollmentId={enrollmentId}
				groupName={groupName}
				assignments={assignments}
			/>
		</div>
	);
}
