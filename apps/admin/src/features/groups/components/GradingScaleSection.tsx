import { useState } from 'react';

import { Button, Card, Skeleton, Spinner, toast } from '@repo/ui';

import { Can } from '@/components/Can';

import {
	type GradingConfig,
	type GradingType,
	useGroupGradingConfig,
} from '../api/grading-config.queries';
import { useSetGroupGradingConfig } from '../api/grading-config.mutations';
import { formatGradingScale } from '../lib/group-options';
import { GradingScaleControl } from './GradingScaleControl';

/** A sensible default max when switching into a numeric scale. */
function defaultMax(type: GradingType): string {
	return type === 'PERCENTAGE' ? '100' : '10';
}

interface GradingScaleSectionProps {
	groupId: number;
}

/**
 * The group's daily-mark grading scale (`GET`/`POST
 * /manage/groups/:id/grading-config`, §1.1) on the detail page. Switching the
 * scale is immutable on the backend — it inserts a new active config and keeps
 * marks already entered under the old one — so this is a distinct action from
 * editing the group itself. Gated by `group.update`.
 */
export function GradingScaleSection({ groupId }: GradingScaleSectionProps) {
	const query = useGroupGradingConfig(groupId);
	const current = query.data?.current ?? null;

	return (
		<Card className="flex flex-col gap-4 p-5">
			<div>
				<h2 className="text-sm font-semibold">Grading scale</h2>
				<p className="mt-0.5 text-sm text-muted-foreground">
					{current
						? `Daily marks use ${formatGradingScale(current)}.`
						: 'How daily marks are entered for this group.'}
				</p>
			</div>

			{query.isLoading ? (
				<Skeleton className="h-40 w-full rounded-xl" />
			) : current ? (
				<GradingScaleForm key={current.id} groupId={groupId} current={current} />
			) : (
				<p className="text-sm text-muted-foreground">No grading scale set.</p>
			)}

			{query.data && query.data.history.length > 0 && (
				<p className="text-xs text-muted-foreground">
					{query.data.history.length} previous scale
					{query.data.history.length === 1 ? '' : 's'} kept for past marks.
				</p>
			)}
		</Card>
	);
}

interface GradingScaleFormProps {
	groupId: number;
	current: GradingConfig;
}

/** The scale editor, seeded once from the active config at mount. */
function GradingScaleForm({ groupId, current }: GradingScaleFormProps) {
	const setConfig = useSetGroupGradingConfig(groupId);
	const [type, setType] = useState<GradingType>(current.type);
	const [maxPoints, setMaxPoints] = useState(
		current.maxPoints != null ? String(current.maxPoints) : defaultMax(current.type),
	);
	const [allowHalf, setAllowHalf] = useState(current.allowHalf);

	const numericMax = Number(maxPoints);
	const invalid = type !== 'LETTER' && !(numericMax > 0);

	const onSave = () => {
		const input: { type: GradingType; maxPoints?: number; allowHalf?: boolean } = {
			type,
		};
		if (type !== 'LETTER') input.maxPoints = numericMax;
		if (type === 'POINTS') input.allowHalf = allowHalf;
		setConfig.mutate(input, {
			onSuccess: () => toast.success('Grading scale updated'),
		});
	};

	return (
		<div className="flex flex-col gap-4">
			<GradingScaleControl
				idPrefix="edit"
				type={type}
				maxPoints={maxPoints}
				allowHalf={allowHalf}
				onTypeChange={(next) => {
					setType(next);
					if (next !== 'LETTER' && maxPoints.trim() === '') {
						setMaxPoints(defaultMax(next));
					}
					if (next !== 'POINTS') setAllowHalf(false);
				}}
				onMaxPointsChange={setMaxPoints}
				onAllowHalfChange={setAllowHalf}
			/>
			<Can permission="group.update">
				<div className="flex justify-end">
					<Button onClick={onSave} disabled={invalid || setConfig.isPending}>
						{setConfig.isPending && <Spinner className="mr-2 size-4" />}
						Save grading scale
					</Button>
				</div>
			</Can>
		</div>
	);
}
