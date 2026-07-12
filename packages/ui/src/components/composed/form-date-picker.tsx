import { type Control, type FieldPath, type FieldValues } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../form';
import { DatePicker } from './date-picker';

interface FormDatePickerProps<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
	control: Control<TFieldValues>;
	name: TName;
	label?: string;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
	/** Earliest selectable date, as an ISO calendar date ("YYYY-MM-DD"). */
	minDate?: string;
	/** Latest selectable date, as an ISO calendar date ("YYYY-MM-DD"). */
	maxDate?: string;
}

export function FormDatePicker<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
	control,
	name,
	label,
	placeholder,
	disabled,
	className,
	minDate,
	maxDate,
}: FormDatePickerProps<TFieldValues, TName>) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem>
					{label && <FormLabel>{label}</FormLabel>}
					<FormControl>
						<DatePicker
							value={field.value ?? undefined}
							onChange={field.onChange}
							placeholder={placeholder}
							disabled={disabled ?? field.disabled}
							className={className}
							minDate={minDate}
							maxDate={maxDate}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
