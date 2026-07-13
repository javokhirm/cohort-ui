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
} from '@repo/ui';

import { resetPasswordSchema, type ResetPasswordFormValues } from '../schemas';
import { useResetPassword } from '../hooks';

export function ResetPasswordDialog({
	userId,
	fullName,
	open,
	onOpenChange,
}: {
	userId: number;
	fullName: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const form = useForm<ResetPasswordFormValues>({
		resolver: zodResolver(resetPasswordSchema),
		defaultValues: { newPassword: '' },
	});

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) {
			form.reset();
			mutation.reset();
		}
		onOpenChange(nextOpen);
	}

	const mutation = useResetPassword(userId, {
		onSuccess: () => {
			form.reset();
			onOpenChange(false);
		},
	});

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>Reset password</DialogTitle>
					<DialogDescription>
						Set a new password for <strong>{fullName}</strong>. They will need
						to use this password on their next login.
					</DialogDescription>
				</DialogHeader>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
						className="flex flex-col gap-4"
					>
						<FormPasswordInput
							control={form.control}
							name="newPassword"
							label="New password"
							placeholder="Min. 8 characters"
							autoComplete="new-password"
						/>
						{mutation.isError && (
							<p className="text-sm text-destructive">
								{isApiError(mutation.error)
									? mutation.error.message
									: 'Failed to reset password. Please try again.'}
							</p>
						)}
						<DialogFooter>
							<Button
								type="button"
								variant="outline"
								onClick={() => handleOpenChange(false)}
								disabled={mutation.isPending}
							>
								Cancel
							</Button>
							<Button type="submit" disabled={mutation.isPending}>
								{mutation.isPending && (
									<Spinner className="mr-2 size-4" />
								)}
								Reset password
							</Button>
						</DialogFooter>
					</form>
				</Form>
			</DialogContent>
		</Dialog>
	);
}
