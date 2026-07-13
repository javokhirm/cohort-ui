import { type Control, type FieldPath, type FieldValues } from 'react-hook-form';

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '../form';
import { PhoneInput, type PhoneInputProps } from './phone-input';

interface FormPhoneInputProps<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> extends Omit<PhoneInputProps, 'value' | 'onChange'> {
	control: Control<TFieldValues>;
	name: TName;
	label?: string;
}

/** RHF-bound {@link PhoneInput}. Emits the plain E.164 string (or `''` when cleared). */
export function FormPhoneInput<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ control, name, label, ...inputProps }: FormPhoneInputProps<TFieldValues, TName>) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem>
					{label && <FormLabel>{label}</FormLabel>}
					<FormControl>
						<PhoneInput
							{...inputProps}
							ref={field.ref}
							name={field.name}
							value={field.value ?? ''}
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
