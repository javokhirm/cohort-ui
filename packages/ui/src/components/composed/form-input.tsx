import * as React from 'react';
import { type Control, type FieldPath, type FieldValues } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../form';
import { Input } from '../input';

interface FormInputProps<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<React.ComponentProps<typeof Input>, 'name'> {
	control: Control<TFieldValues>;
	name: TName;
	label?: string;
}

export function FormInput<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ control, name, label, onChange: onChangeProp, ...inputProps }: FormInputProps<TFieldValues, TName>) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem>
					{label && <FormLabel>{label}</FormLabel>}
					<FormControl>
						<Input {...inputProps} {...field} onChange={onChangeProp ?? field.onChange} />
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
