import { useState } from 'react';

import { Button, Skeleton, Spinner, toast } from '@repo/ui';
import { useAppT } from '@/locales';

import { Can } from '@/components/Can';
import { FormSection } from '@/components/FormSection';

import {
	type GradingConfig,
	type GradingType,
	useGroupGradingConfig,
} from '../api/grading-config.queries';
import { useSetGroupGradingConfig } from '../api/grading-config.mutations';
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
 * /manage/groups/:id/grading-config`, §1.1) on the group edit page. Switching
 * the scale is immutable on the backend — it inserts a new active config and
 * keeps marks already entered under the old one — so this saves on its own,
 * separately from the group form it sits beside (and outside that form's
 * `<form>` element, so its inputs never submit the group). Gated by
 * `group.update`.
 */
export function GradingScaleSection({ groupId }: GradingScaleSectionProps) {
	const t = useAppT('groups');
	const query = useGroupGradingConfig(groupId);
	const current = query.data?.current ?? null;

	return (
		<FormSection
			title={t('form.section.gradingScale')}
			className="border border-border bg-card shadow-xs"
		>
			<p className="text-sm text-muted-foreground">
				{t('grading.description')}
			</p>

			{query.isLoading ? (
				<Skeleton className="h-40 w-full rounded-xl" />
			) : current ? (
				<GradingScaleForm key={current.id} groupId={groupId} current={current} />
			) : (
				<p className="text-sm text-muted-foreground">{t('grading.none')}</p>
			)}

			{query.data && query.data.history.length > 0 && (
				<p className="text-xs text-muted-foreground">
					{t('grading.historyKept', {
						count: query.data.history.length,
					})}
				</p>
			)}
		</FormSection>
	);
}

interface GradingScaleFormProps {
	groupId: number;
	current: GradingConfig;
}

/** The scale editor, seeded once from the active config at mount. */
function GradingScaleForm({ groupId, current }: GradingScaleFormProps) {
	const t = useAppT('groups');
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
			onSuccess: () => toast.success(t('grading.updated')),
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
					<Button
						type="button"
						onClick={onSave}
						disabled={invalid || setConfig.isPending}
					>
						{setConfig.isPending && <Spinner className="mr-2 size-4" />}
						{t('actions.saveGradingScale')}
					</Button>
				</div>
			</Can>
		</div>
	);
}
