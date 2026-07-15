import { useFormContext } from 'react-hook-form';

import type { GradingType } from '../api/grading-config.queries';
import type { CreateGroupFormValues } from '../schemas/group-form.schema';
import { GradingScaleControl } from './GradingScaleControl';

/** A sensible default max when switching into a numeric scale. */
function defaultMax(type: GradingType): string {
	return type === 'PERCENTAGE' ? '100' : '10';
}

/**
 * Grading-scale editor for the create form, driven by the surrounding group form
 * (`useFormContext`), mirroring how `ScheduleRuleFields` works. Sets the group's
 * initial daily-mark scale, which is sent as `gradingConfig` on create. (Editing
 * an existing group's scale uses the separate section on the detail page.)
 */
export function GradingScaleFields() {
	const form = useFormContext<CreateGroupFormValues>();
	const type = form.watch('gradingType');
	const maxPoints = form.watch('gradingMaxPoints');
	const allowHalf = form.watch('gradingAllowHalf');
	const maxError = form.formState.errors.gradingMaxPoints?.message;

	return (
		<GradingScaleControl
			idPrefix="create"
			type={type}
			maxPoints={maxPoints}
			allowHalf={allowHalf}
			maxError={maxError}
			onTypeChange={(next) => {
				form.setValue('gradingType', next, { shouldValidate: true });
				if (next !== 'LETTER' && maxPoints.trim() === '') {
					form.setValue('gradingMaxPoints', defaultMax(next), {
						shouldValidate: true,
					});
				}
				if (next !== 'POINTS') form.setValue('gradingAllowHalf', false);
			}}
			onMaxPointsChange={(v) =>
				form.setValue('gradingMaxPoints', v, { shouldValidate: true })
			}
			onAllowHalfChange={(v) => form.setValue('gradingAllowHalf', v)}
		/>
	);
}
