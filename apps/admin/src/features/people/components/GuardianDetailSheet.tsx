import { useMemo, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Pencil, Plus, Trash2 } from 'lucide-react';

import {
	Button,
	ConfirmDialog,
	FieldGroup,
	Form,
	FormInput,
	FormPhoneInput,
	Separator,
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	Skeleton,
	StatusBadge,
	Spinner,
	toast,
} from '@repo/ui';
import { isApiError } from '@repo/api-client';
import { useT } from '@repo/i18n';

import { Can } from '@/components/Can';
import { useAppT } from '@/locales';
import { useGuardian, type GuardianCandidate } from '../api/guardians.queries';
import { useUpdateGuardian } from '../api/guardians.mutations';
import { useRemoveGuardian } from '../api/students.mutations';
import {
	editGuardianSchema,
	type EditGuardianFormValues,
} from '../schemas/edit-guardian.schema';
import { LinkStudentDialog } from './LinkStudentDialog';

interface GuardianDetailSheetProps {
	guardianId: number | null;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

export function GuardianDetailSheet({
	guardianId,
	open,
	onOpenChange,
}: GuardianDetailSheetProps) {
	const t = useAppT('people');
	const { data: guardian, isLoading } = useGuardian(open ? (guardianId ?? 0) : 0);
	const [editing, setEditing] = useState(false);
	const [linkOpen, setLinkOpen] = useState(false);

	function handleOpenChange(next: boolean) {
		if (!next) setEditing(false);
		onOpenChange(next);
	}

	const fullName = guardian
		? `${guardian.user.firstName} ${guardian.user.lastName}`.trim()
		: '';

	return (
		<Sheet open={open} onOpenChange={handleOpenChange}>
			<SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
				<SheetHeader className="border-b px-6 py-4">
					<SheetTitle>{t('guardiansPage.detail.title')}</SheetTitle>
				</SheetHeader>

				<div className="flex-1 overflow-y-auto p-6">
					{isLoading || !guardian ? (
						<div className="flex flex-col gap-3">
							<Skeleton className="h-20 w-full" />
							<Skeleton className="h-40 w-full" />
						</div>
					) : editing ? (
						<EditGuardianForm
							guardian={guardian}
							onDone={() => setEditing(false)}
							onCancel={() => setEditing(false)}
						/>
					) : (
						<div className="flex flex-col gap-4">
							<div className="rounded-xl border bg-card p-4">
								<div className="flex items-start justify-between">
									<div className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-bold text-primary">
										{`${guardian.user.firstName[0] ?? ''}${guardian.user.lastName[0] ?? ''}`.toUpperCase()}
									</div>
									<Can permission="student.guardian.manage">
										<Button
											variant="ghost"
											size="sm"
											aria-label={t('guardiansPage.detail.edit')}
											onClick={() => setEditing(true)}
										>
											<Pencil className="size-4" />
										</Button>
									</Can>
								</div>
								<div className="mt-3">
									<div className="text-base font-bold">{fullName}</div>
									<div className="text-sm text-muted-foreground">
										{guardian.user.phone ?? '—'}
									</div>
								</div>
							</div>

							<LinkedStudentsSection
								guardian={guardian}
								onLinkStudent={() => setLinkOpen(true)}
							/>
						</div>
					)}
				</div>
			</SheetContent>

			{guardian && (
				<LinkStudentDialog
					guardianUserId={guardian.user.id}
					open={linkOpen}
					onOpenChange={setLinkOpen}
				/>
			)}
		</Sheet>
	);
}

function EditGuardianForm({
	guardian,
	onDone,
	onCancel,
}: {
	guardian: GuardianCandidate;
	onDone: () => void;
	onCancel: () => void;
}) {
	const t = useAppT('people');
	const tc = useT('common');
	const tv = useT('validation');
	const schema = useMemo(() => editGuardianSchema(tv), [tv]);
	const updateGuardian = useUpdateGuardian();

	const form = useForm<EditGuardianFormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			firstName: guardian.user.firstName,
			lastName: guardian.user.lastName,
			phone: guardian.user.phone ?? '',
		},
	});

	async function onSubmit(values: EditGuardianFormValues) {
		try {
			await updateGuardian.mutateAsync({
				id: guardian.user.id,
				firstName: values.firstName,
				lastName: values.lastName,
				phone: values.phone || null,
			});
			toast.success(t('guardiansPage.detail.saved'));
			onDone();
		} catch (err) {
			toast.error(isApiError(err) ? err.message : t('guardiansPage.detail.saveFailed'));
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
						name="firstName"
						label={t('guardiansPage.detail.field.firstName')}
					/>
					<FormInput
						control={form.control}
						name="lastName"
						label={t('guardiansPage.detail.field.lastName')}
					/>
					<FormPhoneInput
						control={form.control}
						name="phone"
						label={t('guardiansPage.detail.field.phone')}
					/>
				</FieldGroup>

				<div className="flex justify-end gap-2">
					<Button
						type="button"
						variant="outline"
						onClick={onCancel}
						disabled={updateGuardian.isPending}
					>
						{tc('action.cancel')}
					</Button>
					<Button type="submit" disabled={updateGuardian.isPending}>
						{updateGuardian.isPending && <Spinner className="mr-2 size-4" />}
						{t('guardiansPage.detail.save')}
					</Button>
				</div>
			</form>
		</Form>
	);
}

function LinkedStudentsSection({
	guardian,
	onLinkStudent,
}: {
	guardian: GuardianCandidate;
	onLinkStudent: () => void;
}) {
	const t = useAppT('people');
	const removeGuardian = useRemoveGuardian();
	const [unlinkTarget, setUnlinkTarget] = useState<
		GuardianCandidate['students'][number] | null
	>(null);

	function handleUnlink() {
		if (!unlinkTarget) return;
		removeGuardian.mutate(
			{ studentId: unlinkTarget.studentId, guardianId: guardian.user.id },
			{
				onSuccess: () => {
					toast.success(t('guardiansPage.detail.unlinked'));
					setUnlinkTarget(null);
				},
				onError: (err) =>
					toast.error(
						isApiError(err) ? err.message : t('guardiansPage.detail.unlinkFailed'),
					),
			},
		);
	}

	const addButton = (
		<Can permission="student.guardian.manage">
			<Button size="sm" variant="outline" onClick={onLinkStudent}>
				<Plus className="mr-1.5 size-4" />
				{t('guardiansPage.detail.linkStudent')}
			</Button>
		</Can>
	);

	return (
		<div className="flex flex-col gap-3">
			<div className="flex items-center justify-between">
				<span className="text-[10.5px] font-semibold tracking-widest text-muted-foreground uppercase">
					{t('guardiansPage.detail.linkedStudentsTitle')}
				</span>
				{addButton}
			</div>

			{guardian.students.length === 0 ? (
				<p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
					{t('guardiansPage.noStudents')}
				</p>
			) : (
				<div className="rounded-xl border bg-card">
					{guardian.students.map((s, i) => (
						<div key={s.studentId}>
							{i > 0 && <Separator />}
							<div className="flex items-center justify-between p-4">
								<div>
									<div className="flex items-center gap-2">
										<span className="text-xs font-semibold text-muted-foreground">
											{t(`relation.${s.relation}`)}
										</span>
										<span className="font-medium">
											{s.firstName} {s.lastName}
										</span>
										{s.isPrimary && (
											<StatusBadge tone="indigo">
												{t('detail.guardians.primary')}
											</StatusBadge>
										)}
									</div>
									<div className="mt-0.5 font-mono text-xs text-muted-foreground">
										{s.studentCode}
									</div>
								</div>
								<Can permission="student.guardian.manage">
									<Button
										variant="ghost"
										size="sm"
										className="text-muted-foreground hover:text-destructive"
										onClick={() => setUnlinkTarget(s)}
									>
										<Trash2 className="size-4" />
									</Button>
								</Can>
							</div>
						</div>
					))}
				</div>
			)}

			<ConfirmDialog
				open={unlinkTarget != null}
				onOpenChange={(next) => !next && setUnlinkTarget(null)}
				title={t('guardiansPage.detail.unlinkConfirm', {
					name: unlinkTarget ? `${unlinkTarget.firstName} ${unlinkTarget.lastName}` : '',
				})}
				confirmLabel={t('guardiansPage.detail.unlink')}
				variant="destructive"
				loading={removeGuardian.isPending}
				onConfirm={handleUnlink}
			/>
		</div>
	);
}
