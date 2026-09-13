import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	FieldGroup,
	Form,
	FormControl,
	FormField,
	FormInput,
	FormItem,
	FormPhoneInput,
	FormSelect,
	Spinner,
	Switch,
	toast,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { useT } from '@repo/i18n';

import { useAppT } from '@/locales';

import { useAddGuardian } from '../api/students.mutations';
import {
	addGuardianSchema,
	type AddGuardianFormValues,
} from '../schemas/add-guardian.schema';
import { splitFullName } from '../schemas/student-form.schema';

/** Option tables hold values only — labels resolve at render (conventions.md §7). */
const GUARDIAN_RELATION_OPTIONS = [
	{ value: 'father' },
	{ value: 'mother' },
	{ value: 'guardian' },
] as const;

interface AddGuardianDialogProps {
	studentId: number;
	/** The first guardian added defaults to primary; later ones don't. */
	isFirstGuardian: boolean;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function AddGuardianDialog({
	studentId,
	isFirstGuardian,
	open,
	onOpenChange,
}: AddGuardianDialogProps) {
	const t = useAppT('people');

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{t('detail.guardians.add')}</DialogTitle>
					<DialogDescription>
						{t('detail.guardians.addDescription')}
					</DialogDescription>
				</DialogHeader>

				{/* Mounts fresh on each open (DialogContent unmounts on close), so the
				    form state resets without a reset effect. */}
				{open && (
					<AddGuardianForm
						studentId={studentId}
						isFirstGuardian={isFirstGuardian}
						onClose={() => onOpenChange(false)}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

function AddGuardianForm({
	studentId,
	isFirstGuardian,
	onClose,
}: {
	studentId: number;
	isFirstGuardian: boolean;
	onClose: () => void;
}) {
	const t = useAppT('people');
	const tc = useT('common');
	const tv = useT('validation');
	const schema = useMemo(() => addGuardianSchema(tv, t), [tv, t]);

	const form = useForm<AddGuardianFormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			guardianName: '',
			guardianPhone: '',
			guardianRelation: 'father',
			isPrimary: isFirstGuardian,
			canPickup: true,
		},
	});

	const addGuardian = useAddGuardian();

	async function onSubmit(values: AddGuardianFormValues) {
		const { firstName, lastName } = splitFullName(values.guardianName);
		try {
			await addGuardian.mutateAsync({
				studentId,
				phone: values.guardianPhone,
				firstName,
				lastName,
				relation: values.guardianRelation,
				isPrimary: values.isPrimary,
				canPickup: values.canPickup,
			});
			toast.success(t('detail.guardians.added'));
			onClose();
		} catch (err) {
			toast.error(isApiError(err) ? err.message : t('detail.guardians.addFailed'));
		}
	}

	return (
		<Form {...form}>
			<form
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<FieldGroup>
					<FormInput
						control={form.control}
						name="guardianName"
						label={t('form.field.guardianName')}
						placeholder={t('form.field.guardianNamePlaceholder')}
					/>
					<FormSelect
						control={form.control}
						name="guardianRelation"
						label={t('form.field.relation')}
						options={GUARDIAN_RELATION_OPTIONS.map((o) => ({
							value: o.value,
							label: t(`relation.${o.value}`),
						}))}
					/>
					<FormPhoneInput
						control={form.control}
						name="guardianPhone"
						label={t('form.field.guardianPhone')}
					/>
				</FieldGroup>

				<FieldGroup>
					<FormField
						control={form.control}
						name="isPrimary"
						render={({ field }) => (
							<FormItem className="flex flex-row items-center justify-between gap-4">
								<span className="text-sm font-medium text-foreground">
									{t('detail.guardians.primaryLabel')}
								</span>
								<FormControl>
									<Switch
										checked={field.value}
										onCheckedChange={field.onChange}
									/>
								</FormControl>
							</FormItem>
						)}
					/>
				</FieldGroup>

				<DialogFooter className="mt-2">
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={addGuardian.isPending}
					>
						{tc('action.cancel')}
					</Button>
					<Button type="submit" disabled={addGuardian.isPending}>
						{addGuardian.isPending && <Spinner className="mr-2 size-4" />}
						{t('detail.guardians.add')}
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}
