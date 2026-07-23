import { useFormContext } from 'react-hook-form';

import { cn, FormInput } from '@repo/ui';
import { useAppT } from '@/locales';

import { SCHEDULE_DAYS, type ScheduleDay } from '../api/groups.queries';
import type { CreateGroupFormValues } from '../schemas/group-form.schema';

/**
 * Weekly schedule-rule editor (day picker + start/end time) driven by the
 * surrounding group form. Together with a start+end date, the backend
 * materializes individual sessions for the whole range.
 */
export function ScheduleRuleFields() {
	const t = useAppT('groups');
	// Edit form values are a superset of create values, so the shared schedule
	// fields resolve against the create shape in both modes.
	const form = useFormContext<CreateGroupFormValues>();
	const days = form.watch('days');
	const daysError = form.formState.errors.days?.message;

	function toggleDay(day: ScheduleDay) {
		const next = days.includes(day) ? days.filter((d) => d !== day) : [...days, day];
		form.setValue('days', next, { shouldValidate: true });
	}

	return (
		<div className="flex flex-col gap-3">
			<div className="flex flex-col gap-1.5">
				<span className="text-sm font-medium">{t('form.field.days')}</span>
				<div className="flex flex-wrap gap-1.5">
					{SCHEDULE_DAYS.map((day) => {
						const active = days.includes(day);
						return (
							<button
								key={day}
								type="button"
								onClick={() => toggleDay(day)}
								aria-pressed={active}
								className={cn(
									'h-9 w-11 rounded-lg border text-xs font-semibold transition-colors',
									active
										? 'border-primary bg-primary text-primary-foreground'
										: 'border-border bg-card text-muted-foreground hover:bg-muted',
								)}
							>
								{t(`day.${day}`)}
							</button>
						);
					})}
				</div>
				{daysError && (
					<span className="text-sm text-destructive">{daysError}</span>
				)}
			</div>

			<div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
				<FormInput
					control={form.control}
					name="startTime"
					label={t('form.field.startTime')}
					type="time"
				/>
				<FormInput
					control={form.control}
					name="endTime"
					label={t('form.field.endTime')}
					type="time"
				/>
			</div>
		</div>
	);
}
