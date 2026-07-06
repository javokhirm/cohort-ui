import * as React from 'react';
import { Slot as SlotPrimitive } from 'radix-ui';
import {
	Controller,
	FormProvider,
	useFormContext,
	useFormState,
	type ControllerProps,
	type FieldPath,
	type FieldValues,
} from 'react-hook-form';

import { cn } from '../lib/utils';
import { Label } from './label';

/**
 * RHF-aware form wrappers (the `FieldGroup + React Hook Form + Zod` pattern from CLAUDE.md).
 * `Form` is React Hook Form's provider; `FormField` binds a control to a field; the rest are
 * the labelled, a11y-wired layout around each field. Pair with a Zod resolver at the call
 * site (`useForm({ resolver: zodResolver(schema) })`) — Zod lives in the app/feature, not here.
 */
const Form: typeof FormProvider = FormProvider;

interface FormFieldContextValue<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
	name: TName;
}

const FormFieldContext = React.createContext<FormFieldContextValue>(
	{} as FormFieldContextValue,
);

function FormField<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(props: ControllerProps<TFieldValues, TName>) {
	return (
		<FormFieldContext.Provider value={{ name: props.name }}>
			<Controller {...props} />
		</FormFieldContext.Provider>
	);
}

interface FormItemContextValue {
	id: string;
}

const FormItemContext = React.createContext<FormItemContextValue>(
	{} as FormItemContextValue,
);

function useFormField() {
	const fieldContext = React.useContext(FormFieldContext);
	const itemContext = React.useContext(FormItemContext);
	const { getFieldState } = useFormContext();
	const formState = useFormState({ name: fieldContext.name });
	const fieldState = getFieldState(fieldContext.name, formState);

	if (!fieldContext) {
		throw new Error('useFormField should be used within <FormField>');
	}

	const { id } = itemContext;

	return {
		id,
		name: fieldContext.name,
		formItemId: `${id}-form-item`,
		formDescriptionId: `${id}-form-item-description`,
		formMessageId: `${id}-form-item-message`,
		...fieldState,
	};
}

/** Vertical stack of fields with consistent spacing. Wrap related FormItems in one. */
function FieldGroup({ className, ...props }: React.ComponentProps<'div'>) {
	return (
		<div data-slot="field-group" className={cn('grid gap-4', className)} {...props} />
	);
}

function FormItem({ className, ...props }: React.ComponentProps<'div'>) {
	const id = React.useId();

	return (
		<FormItemContext.Provider value={{ id }}>
			<div
				data-slot="form-item"
				className={cn('grid gap-2', className)}
				{...props}
			/>
		</FormItemContext.Provider>
	);
}

function FormLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
	const { error, formItemId } = useFormField();

	return (
		<Label
			data-slot="form-label"
			data-error={!!error}
			className={cn('data-[error=true]:text-destructive', className)}
			htmlFor={formItemId}
			{...props}
		/>
	);
}

function FormControl({ ...props }: React.ComponentProps<typeof SlotPrimitive.Root>) {
	const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

	return (
		<SlotPrimitive.Root
			data-slot="form-control"
			id={formItemId}
			aria-describedby={
				error ? `${formDescriptionId} ${formMessageId}` : `${formDescriptionId}`
			}
			aria-invalid={!!error}
			{...props}
		/>
	);
}

function FormDescription({ className, ...props }: React.ComponentProps<'p'>) {
	const { formDescriptionId } = useFormField();

	return (
		<p
			data-slot="form-description"
			id={formDescriptionId}
			className={cn('text-sm text-muted-foreground', className)}
			{...props}
		/>
	);
}

function FormMessage({ className, ...props }: React.ComponentProps<'p'>) {
	const { error, formMessageId } = useFormField();
	const body = error ? String(error?.message ?? '') : props.children;

	if (!body) {
		return null;
	}

	return (
		<p
			data-slot="form-message"
			id={formMessageId}
			className={cn('text-sm font-medium text-destructive', className)}
			{...props}
		>
			{body}
		</p>
	);
}

export {
	Form,
	FormItem,
	FormLabel,
	FormControl,
	FormDescription,
	FormMessage,
	FormField,
	FieldGroup,
	useFormField,
};
