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
	FormItem,
	FormLabel,
	FormMessage,
	FormSelect,
	Spinner,
	Switch,
	toast,
} from '@repo/ui';
import { StudentPicker } from '@/features/billing';
import { isApiError } from '@repo/api-client';
import { useT } from '@repo/i18n';

import { useAppT } from '@/locales';
import { useLinkGuardian } from '../api/students.mutations';
import { GUARDIAN_RELATIONS } from '../lib/guardian-input';
import {
	linkStudentSchema,
	type LinkStudentFormValues,
} from '../schemas/link-student.schema';

interface LinkStudentDialogProps {
	guardianUserId: number;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/** Connect an existing guardian (the Guardians page's detail sheet) to another student. */
export function LinkStudentDialog({
	guardianUserId,
	open,
	onOpenChange,
}: LinkStudentDialogProps) {
	const t = useAppT('people');

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{t('guardiansPage.linkDialog.title')}</DialogTitle>
					<DialogDescription>
						{t('guardiansPage.linkDialog.description')}
					</DialogDescription>
				</DialogHeader>

				{/* Mounts fresh on each open (DialogContent unmounts on close), so the
				    form state resets without a reset effect. */}
				{open && (
					<LinkStudentForm
						guardianUserId={guardianUserId}
						onClose={() => onOpenChange(false)}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

function LinkStudentForm({
	guardianUserId,
	onClose,
}: {
	guardianUserId: number;
	onClose: () => void;
}) {
	const t = useAppT('people');
	const tc = useT('common');
	const tv = useT('validation');
	const schema = useMemo(() => linkStudentSchema(tv), [tv]);

	const form = useForm<LinkStudentFormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			studentId: undefined,
			relation: undefined,
			isPrimary: false,
			canPickup: true,
		},
	});

	const linkGuardian = useLinkGuardian();

	async function onSubmit(values: LinkStudentFormValues) {
		try {
			await linkGuardian.mutateAsync({
				studentId: values.studentId,
				guardianUserId,
				relation: values.relation,
				isPrimary: values.isPrimary,
				canPickup: values.canPickup,
			});
			toast.success(t('guardiansPage.linkDialog.linked'));
			onClose();
		} catch (err) {
			toast.error(isApiError(err) ? err.message : t('guardiansPage.linkDialog.linkFailed'));
		}
	}

	return (
		<Form {...form}>
			<form
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<FormField
					control={form.control}
					name="studentId"
					render={({ field }) => (
						<FormItem>
							<FormLabel>{t('guardiansPage.linkDialog.student')}</FormLabel>
							<FormControl>
								<StudentPicker value={field.value} onChange={field.onChange} />
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>

				<FormSelect
					control={form.control}
					name="relation"
					label={t('guardiansPage.linkDialog.relation')}
					options={GUARDIAN_RELATIONS.map((r) => ({
						value: r,
						label: t(`relation.${r}`),
					}))}
				/>

				<FieldGroup>
					<FormField
						control={form.control}
						name="isPrimary"
						render={({ field }) => (
							<FormItem className="flex flex-row items-center justify-between gap-4">
								<span className="text-sm font-medium text-foreground">
									{t('guardiansPage.linkDialog.primaryLabel')}
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
					<FormField
						control={form.control}
						name="canPickup"
						render={({ field }) => (
							<FormItem className="flex flex-row items-center justify-between gap-4">
								<span className="text-sm font-medium text-foreground">
									{t('guardiansPage.linkDialog.pickupLabel')}
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
						disabled={linkGuardian.isPending}
					>
						{tc('action.cancel')}
					</Button>
					<Button type="submit" disabled={linkGuardian.isPending}>
						{linkGuardian.isPending && <Spinner className="mr-2 size-4" />}
						{t('guardiansPage.linkDialog.submit')}
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}
