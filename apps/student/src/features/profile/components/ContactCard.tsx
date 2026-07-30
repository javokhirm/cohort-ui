import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

import { isApiError } from '@repo/api-client';
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	PhoneInput,
	toast,
} from '@repo/ui';
import { useT } from '@repo/i18n';

import { useUpdateMyProfile } from '@/features/profile/api/profile.mutations';
import { contactSchema, type ContactInput } from '@/features/profile/schemas';
import { useAppT } from '@/locales';

interface ContactCardProps {
	phone: string;
	email: string | null;
}

/**
 * The Contact card: the student's phone and email, both editable.
 */
export function ContactCard({ phone, email }: ContactCardProps) {
	const t = useAppT('profile');
	const tValidation = useT('validation');
	const mutation = useUpdateMyProfile();

	const stored: ContactInput = { phone, email: email ?? '' };
	const form = useForm<ContactInput>({
		resolver: zodResolver(contactSchema(tValidation)),
		defaultValues: stored,
		mode: 'onBlur',
	});

	async function commit(name: keyof ContactInput) {
		const value = form.getValues(name);
		if (value === stored[name]) return;
		const valid = await form.trigger(name);
		if (!valid) return;
		try {
			await mutation.mutateAsync({ [name]: value });
			form.resetField(name, { defaultValue: value });
			toast.success(t('savedTitle'), { description: t('savedDescription') });
		} catch (error) {
			form.resetField(name, { defaultValue: stored[name] });
			toast.error(t('saveFailedTitle'), {
				description: isApiError(error) ? error.message : undefined,
			});
		}
	}

	return (
		<div className="mb-4.5 rounded-[15px] border border-border bg-card px-3.5 py-1.5 shadow-xs">
			<Form {...form}>
				<form onSubmit={(event) => event.preventDefault()} noValidate>
					<FormField
						control={form.control}
						name="phone"
						render={({ field }) => (
							<FormItem className="gap-1.5 border-b border-border py-3">
								<FormLabel className="text-[11px] font-semibold uppercase tracking-[0.03em] text-muted-foreground">
									{t('phoneNumber')}
								</FormLabel>
								<FormControl>
									<PhoneInput
										value={field.value}
										onChange={field.onChange}
										disabled={mutation.isPending}
										className="h-10.5 rounded-[10px] text-sm"
										onBlur={() => {
											field.onBlur();
											void commit('phone');
										}}
									/>
								</FormControl>
								<FormMessage className="text-[11.5px]" />
							</FormItem>
						)}
					/>
					<FormField
						control={form.control}
						name="email"
						render={({ field }) => (
							<FormItem className="gap-1.5 py-3">
								<FormLabel className="text-[11px] font-semibold uppercase tracking-[0.03em] text-muted-foreground">
									{t('email')}
								</FormLabel>
								<FormControl>
									<Input
										{...field}
										type="email"
										inputMode="email"
										autoComplete="email"
										disabled={mutation.isPending}
										className="h-10.5 rounded-[10px] px-3 text-sm"
										onBlur={() => {
											field.onBlur();
											void commit('email');
										}}
									/>
								</FormControl>
								<FormMessage className="text-[11.5px]" />
							</FormItem>
						)}
					/>
				</form>
			</Form>
		</div>
	);
}
