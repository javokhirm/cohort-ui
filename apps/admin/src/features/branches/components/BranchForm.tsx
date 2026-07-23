import { useEffect, useMemo, useState } from 'react';
import { useForm, type Control, type FieldPath, type FieldValues } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	Button,
	FieldGroup,
	Form,
	FormControl,
	FormField,
	FormInput,
	FormItem,
	FormPhoneInput,
	Spinner,
	Switch,
	toast,
} from '@repo/ui';
import { useT } from '@repo/i18n';

import { FormSection } from '@/components/FormSection';
import { FormSheet } from '@/components/FormSheet';
import { useAppT } from '@/locales';
import type { Branch } from '@/api/branches';

import {
	createBranchSchema,
	editBranchSchema,
	type CreateBranchFormValues,
	type EditBranchFormValues,
} from '../schemas/branch-form.schema';
import { useCreateBranch, useUpdateBranch } from '../api/branches.mutations';

const DEFAULT_TIMEZONE = 'Asia/Tashkent';

interface CreateProps {
	mode: 'create';
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

interface EditProps {
	mode: 'edit';
	open: boolean;
	onOpenChange: (open: boolean) => void;
	branch: Branch;
}

type BranchFormProps = CreateProps | EditProps;

/** An RHF-bound switch row: bold label, muted description, toggle on the right. */
function SwitchField<
	TFieldValues extends FieldValues = FieldValues,
	TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({
	control,
	name,
	label,
	description,
	disabled,
}: {
	control: Control<TFieldValues>;
	name: TName;
	label: string;
	description?: string;
	disabled?: boolean;
}) {
	return (
		<FormField
			control={control}
			name={name}
			render={({ field }) => (
				<FormItem className="flex flex-row items-center justify-between gap-4">
					<div className="flex flex-col gap-0.5">
						<span className="text-sm font-semibold text-foreground">
							{label}
						</span>
						{description && (
							<span className="text-xs text-muted-foreground">
								{description}
							</span>
						)}
					</div>
					<FormControl>
						<Switch
							checked={Boolean(field.value)}
							onCheckedChange={field.onChange}
							disabled={disabled}
						/>
					</FormControl>
				</FormItem>
			)}
		/>
	);
}

function IdentityAndContact({
	control,
	codeField,
}: {
	control: Control<CreateBranchFormValues> | Control<EditBranchFormValues>;
	/** The short-code field — an editable input on create, a read-only display on edit. */
	codeField: React.ReactNode;
}) {
	const t = useAppT('branches');
	// eslint-disable-next-line @typescript-eslint/no-explicit-any -- one form body serves both modes; fields are shared
	const c = control as Control<any>;
	return (
		<>
			<FormSection title={t('section.identity')}>
				<FieldGroup>
					<FormInput
						control={c}
						name="name"
						label={t('field.name')}
						placeholder={t('field.namePlaceholder')}
					/>
					<div className="grid grid-cols-2 gap-3">
						{codeField}
						<FormInput
							control={c}
							name="timezone"
							label={t('field.timezone')}
							placeholder={DEFAULT_TIMEZONE}
						/>
					</div>
				</FieldGroup>
			</FormSection>

			<FormSection title={t('section.location')}>
				<FieldGroup>
					<FormInput
						control={c}
						name="address"
						label={t('field.address')}
						placeholder={t('field.addressPlaceholder')}
					/>
					<FormPhoneInput control={c} name="phone" label={t('field.phone')} />
				</FieldGroup>
			</FormSection>
		</>
	);
}

function CreateBranchForm({
	onSuccess,
	onPendingChange,
}: {
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const t = useAppT('branches');
	const tc = useT('common');
	const tv = useT('validation');
	const schema = useMemo(() => createBranchSchema(tv, t), [tv, t]);

	const form = useForm<CreateBranchFormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			name: '',
			code: '',
			address: '',
			phone: '',
			timezone: DEFAULT_TIMEZONE,
			isMain: false,
		},
	});

	const createBranch = useCreateBranch();

	useEffect(() => {
		onPendingChange(createBranch.isPending);
	}, [createBranch.isPending, onPendingChange]);

	async function onSubmit(values: CreateBranchFormValues) {
		await createBranch.mutateAsync({
			name: values.name,
			code: values.code.trim(),
			address: values.address,
			phone: values.phone,
			timezone: values.timezone,
			isMain: values.isMain,
		});
		toast.success(t('created'));
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="create-branch-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<IdentityAndContact
					control={form.control}
					codeField={
						<FormInput
							control={form.control}
							name="code"
							label={t('field.code')}
							placeholder={t('field.codePlaceholder')}
						/>
					}
				/>

				<FormSection title={t('section.status')}>
					{/* New branches are always created active (the backend has no create-time
					    `isActive`), so the Active toggle is shown for parity but locked on. */}
					<div className="flex flex-row items-center justify-between gap-4">
						<div className="flex flex-col gap-0.5">
							<span className="text-sm font-semibold text-foreground">
								{tc('state.active')}
							</span>
							<span className="text-xs text-muted-foreground">
								{t('hint.activeOnCreate')}
							</span>
						</div>
						<Switch checked disabled />
					</div>
					<SwitchField
						control={form.control}
						name="isMain"
						label={t('field.isMain')}
						description={t('hint.isMain')}
					/>
				</FormSection>
			</form>
		</Form>
	);
}

function EditBranchForm({
	branch,
	onSuccess,
	onPendingChange,
}: {
	branch: Branch;
	onSuccess: () => void;
	onPendingChange: (pending: boolean) => void;
}) {
	const toDefaults = (b: Branch): EditBranchFormValues => ({
		name: b.name,
		address: b.address ?? '',
		phone: b.phone ?? '',
		timezone: b.timezone ?? DEFAULT_TIMEZONE,
		isMain: b.isMain,
		isActive: b.isActive,
	});

	const t = useAppT('branches');
	const tc = useT('common');
	const tv = useT('validation');
	const schema = useMemo(() => editBranchSchema(tv), [tv]);

	const form = useForm<EditBranchFormValues>({
		resolver: zodResolver(schema),
		defaultValues: toDefaults(branch),
	});

	useEffect(() => {
		form.reset(toDefaults(branch));
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [branch]);

	const updateBranch = useUpdateBranch();

	useEffect(() => {
		onPendingChange(updateBranch.isPending);
	}, [updateBranch.isPending, onPendingChange]);

	async function onSubmit(values: EditBranchFormValues) {
		await updateBranch.mutateAsync({
			id: branch.id,
			name: values.name,
			address: values.address,
			phone: values.phone,
			timezone: values.timezone,
			// A branch that is already main can't be un-set here — there is always one
			// main; you transfer it by enabling Main on another branch.
			isMain: branch.isMain ? undefined : values.isMain,
			isActive: values.isActive,
		});
		toast.success(t('updated'));
		onSuccess();
	}

	return (
		<Form {...form}>
			<form
				id="edit-branch-form"
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<IdentityAndContact
					control={form.control}
					codeField={
						<div className="flex flex-col gap-2">
							<span className="text-sm font-medium leading-none">
								{t('field.codeReadonly')}
							</span>
							<div className="flex h-9 items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
								{branch.code}
							</div>
						</div>
					}
				/>

				<FormSection title={t('section.status')}>
					<SwitchField
						control={form.control}
						name="isActive"
						label={tc('state.active')}
						description={t('hint.activeOnEdit')}
					/>
					<SwitchField
						control={form.control}
						name="isMain"
						label={t('field.isMain')}
						description={
							branch.isMain
								? t('hint.isMainCurrent')
								: t('hint.isMainTransfer')
						}
						disabled={branch.isMain}
					/>
				</FormSection>
			</form>
		</Form>
	);
}

export function BranchForm(props: BranchFormProps) {
	const { open, onOpenChange, mode } = props;
	const t = useAppT('branches');
	const tc = useT('common');
	const [isPending, setIsPending] = useState(false);

	const formId = mode === 'create' ? 'create-branch-form' : 'edit-branch-form';

	function handleClose() {
		onOpenChange(false);
	}

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			title={mode === 'create' ? t('add') : t('edit')}
			description={t('requiredHint')}
			footer={
				<>
					<Button type="button" variant="outline" onClick={handleClose}>
						{tc('action.cancel')}
					</Button>
					<Button type="submit" form={formId} disabled={isPending}>
						{isPending && <Spinner className="mr-2 size-4" />}
						{mode === 'create' ? t('submitCreate') : t('submitUpdate')}
					</Button>
				</>
			}
		>
			{mode === 'create' ? (
				<CreateBranchForm
					onSuccess={handleClose}
					onPendingChange={setIsPending}
				/>
			) : (
				<EditBranchForm
					branch={props.branch}
					onSuccess={handleClose}
					onPendingChange={setIsPending}
				/>
			)}
		</FormSheet>
	);
}
