import { type Control, type FieldPath, type FieldValues } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../select';

export interface SelectOption {
	value: string;
	label: string;
}

interface FormSelectProps<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
	control: Control<TFieldValues>;
	name: TName;
	label?: string;
	placeholder?: string;
	options: SelectOption[];
	/** Coerce the selected string value to a number before calling onChange. */
	valueAsNumber?: boolean;
	disabled?: boolean;
}

export function FormSelect<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
	control,
	name,
	label,
	placeholder = 'Select...',
	options,
	valueAsNumber = false,
	disabled,
}: FormSelectProps<TFieldValues, TName>) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem>
					{label && <FormLabel>{label}</FormLabel>}
					<Select
						onValueChange={(v) =>
							field.onChange(
								valueAsNumber ? (v ? Number(v) : undefined) : v,
							)
						}
						value={field.value != null ? String(field.value) : ''}
						disabled={disabled}
					>
						<FormControl>
							<SelectTrigger>
								<SelectValue placeholder={placeholder} />
							</SelectTrigger>
						</FormControl>
						<SelectContent>
							{options.map((opt) => (
								<SelectItem key={opt.value} value={opt.value}>
									{opt.label}
								</SelectItem>
							))}
						</SelectContent>
					</Select>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
