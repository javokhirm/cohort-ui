import { type Control, type FieldPath, type FieldValues } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../form';
import { MoneyInput, type MoneyInputProps } from './money-input';

interface FormMoneyInputProps<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<MoneyInputProps, 'value' | 'onChange'> {
	control: Control<TFieldValues>;
	name: TName;
	label?: string;
}

/** RHF-bound {@link MoneyInput}. Emits a numeric field value (or `undefined` when cleared). */
export function FormMoneyInput<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ control, name, label, ...inputProps }: FormMoneyInputProps<TFieldValues, TName>) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem>
					{label && <FormLabel>{label}</FormLabel>}
					<FormControl>
						<MoneyInput
							{...inputProps}
							ref={field.ref}
							name={field.name}
							value={field.value ?? undefined}
							onChange={field.onChange}
							onBlur={field.onBlur}
						/>
					</FormControl>
					<FormMessage />
				</FormItem>
			)}
		/>
	);
}
