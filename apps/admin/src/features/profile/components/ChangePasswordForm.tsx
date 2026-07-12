import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { isApiError } from '@repo/api-client';

import {
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	FieldGroup,
	Form,
	FormInput,
	Spinner,
	toast,
} from '@repo/ui';

import { useChangeMyPassword } from '../api/profile.mutations';
import { changePasswordSchema, type ChangePasswordFormValues } from '../schemas';

/**
 * Self-service password change. Posts only `newPassword` — `confirmPassword` is a
 * local typo-guard. The current password is not required: the caller is already
 * authenticated as the account owner.
 */
export function ChangePasswordForm() {
	const form = useForm<ChangePasswordFormValues>({
		resolver: zodResolver(changePasswordSchema),
		defaultValues: { newPassword: '', confirmPassword: '' },
	});

	const changePassword = useChangeMyPassword({
		onSuccess: () => {
			form.reset();
			toast.success('Password changed. Use it the next time you sign in.');
		},
	});

	function onSubmit(values: ChangePasswordFormValues) {
		changePassword.mutate({ newPassword: values.newPassword });
	}

	return (
		<Card>
			<CardHeader>
				<CardTitle>Change password</CardTitle>
				<CardDescription>
					Set a new password for your own account. You stay signed in — the new
					password is needed the next time you sign in.
				</CardDescription>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form
						onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
						className="flex max-w-sm flex-col gap-4"
					>
						<FieldGroup>
							<FormInput
								control={form.control}
								name="newPassword"
								label="New password"
								type="password"
								autoComplete="new-password"
								placeholder="Min. 8 characters"
							/>
							<FormInput
								control={form.control}
								name="confirmPassword"
								label="Confirm new password"
								type="password"
								autoComplete="new-password"
								placeholder="Re-enter the new password"
							/>
						</FieldGroup>

						{changePassword.isError && (
							<p className="text-sm text-destructive">
								{isApiError(changePassword.error)
									? changePassword.error.message
									: 'Failed to change password. Please try again.'}
							</p>
						)}

						<div className="flex justify-start">
							<Button type="submit" disabled={changePassword.isPending}>
								{changePassword.isPending && (
									<Spinner className="mr-2 size-4" />
								)}
								Change password
							</Button>
						</div>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
}
