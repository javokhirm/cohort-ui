import { useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import { isApiError } from '@repo/api-client';
import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Form,
	FormPasswordInput,
	Spinner,
	toast,
} from '@repo/ui';
import { useT } from '@repo/i18n';

import { useAppT } from '@/locales';

import { useChangeStaffPassword } from '../api/staff.mutations';
import {
	changeStaffPasswordSchema,
	type ChangeStaffPasswordFormValues,
} from '../schemas/staff-form.schema';

interface ChangeStaffPasswordDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	staffId: number;
	staffName: string;
}

/**
 * Set a new login password for another staff member. Rendered behind
 * `<Can permission="staff.update">`, which is cosmetic — the server enforces the
 * same code, and additionally refuses a non-OWNER resetting an OWNER.
 *
 * The form is mounted only while `open` so its values reset on close rather than
 * lingering in memory (the same reason `WalletDepositDialog` does it) — a typed
 * password should not survive a cancelled dialog.
 */
export function ChangeStaffPasswordDialog({
	open,
	onOpenChange,
	staffId,
	staffName,
}: ChangeStaffPasswordDialogProps) {
	const t = useAppT('hr');

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>{t('password.title')}</DialogTitle>
					<DialogDescription>
						{t('password.description', { name: staffName })}
					</DialogDescription>
				</DialogHeader>
				{open && (
					<ChangeStaffPasswordForm
						staffId={staffId}
						onClose={() => onOpenChange(false)}
					/>
				)}
			</DialogContent>
		</Dialog>
	);
}

function ChangeStaffPasswordForm({
	staffId,
	onClose,
}: {
	staffId: number;
	onClose: () => void;
}) {
	const t = useAppT('hr');
	const tc = useT('common');
	const tv = useT('validation');
	const schema = useMemo(() => changeStaffPasswordSchema(tv, t), [tv, t]);

	const form = useForm<ChangeStaffPasswordFormValues>({
		resolver: zodResolver(schema),
		defaultValues: { newPassword: '', confirmPassword: '' },
	});
	const changePassword = useChangeStaffPassword(staffId);

	async function onSubmit(values: ChangeStaffPasswordFormValues) {
		try {
			await changePassword.mutateAsync(values.newPassword);
			toast.success(t('password.changed'));
			onClose();
		} catch (err) {
			// The global mutation-cache handler renders a generic message for a 403;
			// name the actual rule so the operator knows this is not a missing
			// permission but a deliberate escalation guard.
			if (isApiError(err) && err.code === 'STAFF_PASSWORD_RESET_FORBIDDEN') {
				toast.error(t('password.ownerOnly'));
			} else if (isApiError(err)) {
				toast.error(err.message);
			} else {
				toast.error(tc('error.unknown'));
			}
		}
	}

	return (
		<Form {...form}>
			<form
				onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
				className="flex flex-col gap-4"
			>
				<FormPasswordInput
					control={form.control}
					name="newPassword"
					label={t('password.newPassword')}
					placeholder={t('password.newPasswordPlaceholder')}
					autoComplete="new-password"
				/>
				<FormPasswordInput
					control={form.control}
					name="confirmPassword"
					label={t('password.confirmPassword')}
					placeholder={t('password.confirmPasswordPlaceholder')}
					autoComplete="new-password"
				/>
				<DialogFooter>
					<Button
						type="button"
						variant="outline"
						onClick={onClose}
						disabled={changePassword.isPending}
					>
						{tc('action.cancel')}
					</Button>
					<Button type="submit" disabled={changePassword.isPending}>
						{changePassword.isPending && <Spinner className="mr-2 size-4" />}
						{t('password.submit')}
					</Button>
				</DialogFooter>
			</form>
		</Form>
	);
}
