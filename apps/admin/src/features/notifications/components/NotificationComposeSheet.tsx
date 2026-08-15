import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Send } from 'lucide-react';

import { isApiError } from '@repo/api-client';
import {
	Button,
	FieldGroup,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	FormSelect,
	Input,
	RadioGroup,
	RadioGroupItem,
	Spinner,
	Textarea,
	toast,
} from '@repo/ui';
import { useT } from '@repo/i18n';

import { useBranches } from '@/api/branches';
import { FormSection } from '@/components/FormSection';
import { FormSheet } from '@/components/FormSheet';
import { useGroupList } from '@/features/groups/api/groups.queries';
import { useAppT } from '@/locales';

import { NOTIFICATION_CHANNELS } from '../api/notifications.queries';
import { useSendNotification } from '../api/notifications.mutations';

const MAX_BODY_LENGTH = 4000;

interface NotificationComposeSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

/**
 * The manual broadcast composer — the "Send message" flow.
 *
 * The backend takes exactly one recipient scope, so the form makes that a choice
 * (a whole branch or a single group) rather than a free-for-all, and converts the
 * picked id to the matching `recipientBranchId` / `recipientGroupId` at submit.
 * The result is reported honestly: `queued` is what actually went out, `skipped`
 * is recipients with no usable address for the channel — surfaced so "why did only
 * 18 of 24 send?" is answered on the spot instead of in the delivery log.
 */
export function NotificationComposeSheet({
	open,
	onOpenChange,
}: NotificationComposeSheetProps) {
	const tn = useAppT('notifications');
	const tv = useT('validation');
	const tc = useT('common');

	const send = useSendNotification();
	const { data: branches } = useBranches();
	const { data: groups } = useGroupList({ limit: 100 });

	const schema = useMemo(
		() =>
			z
				.object({
					channel: z.enum(NOTIFICATION_CHANNELS),
					scope: z.enum(['branch', 'group']),
					branchId: z.string().optional(),
					groupId: z.string().optional(),
					body: z.string().trim().min(1, tv('required')).max(MAX_BODY_LENGTH),
					scheduledAt: z.string().optional(),
				})
				.superRefine((values, ctx) => {
					if (values.scope === 'branch' && !values.branchId) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							path: ['branchId'],
							message: tn('outbox.compose.recipientRequired'),
						});
					}
					if (values.scope === 'group' && !values.groupId) {
						ctx.addIssue({
							code: z.ZodIssueCode.custom,
							path: ['groupId'],
							message: tn('outbox.compose.recipientRequired'),
						});
					}
				}),
		[tv, tn],
	);

	type ComposeValues = z.infer<typeof schema>;

	const form = useForm<ComposeValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			channel: 'SMS',
			scope: 'branch',
			branchId: '',
			groupId: '',
			body: '',
			scheduledAt: '',
		},
	});

	// Re-seed on open so a reopened sheet never shows the previous draft.
	useEffect(() => {
		if (!open) return;
		form.reset({
			channel: 'SMS',
			scope: 'branch',
			branchId: '',
			groupId: '',
			body: '',
			scheduledAt: '',
		});
	}, [open, form]);

	const scope = form.watch('scope');

	const branchOptions = useMemo(
		() => (branches ?? []).map((b) => ({ value: String(b.id), label: b.name })),
		[branches],
	);
	const groupOptions = useMemo(
		() =>
			(groups?.rows ?? []).map((g) => ({
				value: String(g.id),
				label: g.name,
			})),
		[groups],
	);

	const onSubmit = async (values: ComposeValues) => {
		try {
			const result = await send.mutateAsync({
				channel: values.channel,
				body: values.body,
				recipientBranchId:
					values.scope === 'branch' ? Number(values.branchId) : undefined,
				recipientGroupId:
					values.scope === 'group' ? Number(values.groupId) : undefined,
				scheduledAt: values.scheduledAt
					? new Date(values.scheduledAt).toISOString()
					: undefined,
			});
			// `queued` is what went out; `skipped` is resolved recipients with no
			// usable address for the channel — reported so the gap is visible.
			toast.success(
				result.skipped > 0
					? tn('outbox.sentWithSkipped', {
							count: result.queued,
							skipped: result.skipped,
						})
					: tn('outbox.sent', { count: result.queued }),
			);
			onOpenChange(false);
		} catch (err) {
			toast.error(isApiError(err) ? err.message : tn('outbox.sendFailed'));
		}
	};

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			title={tn('outbox.sendTitle')}
			description={tn('outbox.compose.description')}
			maxWidth="lg"
			footer={
				<>
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={send.isPending}
					>
						{tc('action.cancel')}
					</Button>
					<Button
						onClick={() => void form.handleSubmit(onSubmit)()}
						disabled={send.isPending}
					>
						{send.isPending ? (
							<Spinner className="mr-1.5 size-4" />
						) : (
							<Send className="mr-1.5 size-4" />
						)}
						{tn('outbox.send')}
					</Button>
				</>
			}
		>
			<Form {...form}>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						void form.handleSubmit(onSubmit)();
					}}
					className="flex flex-col gap-4"
				>
					<FormSection title={tn('outbox.field.scope')}>
						<FormField
							control={form.control}
							name="scope"
							render={({ field }) => (
								<FormItem>
									<FormControl>
										<RadioGroup
											value={field.value}
											onValueChange={field.onChange}
											className="flex flex-wrap gap-4"
										>
											<label className="flex items-center gap-2 text-sm">
												<RadioGroupItem value="branch" />
												{tn('outbox.field.scopeBranch')}
											</label>
											<label className="flex items-center gap-2 text-sm">
												<RadioGroupItem value="group" />
												{tn('outbox.field.scopeGroup')}
											</label>
										</RadioGroup>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<FieldGroup>
							{scope === 'branch' ? (
								<FormSelect
									control={form.control}
									name="branchId"
									label={tn('outbox.field.branch')}
									options={branchOptions}
								/>
							) : (
								<FormSelect
									control={form.control}
									name="groupId"
									label={tn('outbox.field.group')}
									options={groupOptions}
								/>
							)}
						</FieldGroup>
					</FormSection>

					<FormSection title={tn('outbox.field.channel')}>
						<FieldGroup>
							<FormSelect
								control={form.control}
								name="channel"
								label={tn('outbox.field.channel')}
								options={NOTIFICATION_CHANNELS.map((value) => ({
									value,
									label: tn(`channel.${value}`),
								}))}
							/>
						</FieldGroup>
					</FormSection>

					<FormSection title={tn('outbox.field.body')}>
						<FormField
							control={form.control}
							name="body"
							render={({ field }) => (
								<FormItem>
									<FormLabel>{tn('outbox.field.body')}</FormLabel>
									<FormControl>
										<Textarea
											{...field}
											rows={5}
											maxLength={MAX_BODY_LENGTH}
											placeholder={tn(
												'outbox.field.bodyPlaceholder',
											)}
										/>
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>
					</FormSection>

					<FormSection title={tn('outbox.field.scheduledAt')}>
						<FormField
							control={form.control}
							name="scheduledAt"
							render={({ field }) => (
								<FormItem>
									<FormLabel>
										{tn('outbox.field.scheduledAt')}
									</FormLabel>
									<FormControl>
										<Input type="datetime-local" {...field} />
									</FormControl>
									<p className="text-xs text-muted-foreground">
										{tn('outbox.field.scheduledAtHint')}
									</p>
									<FormMessage />
								</FormItem>
							)}
						/>
					</FormSection>
				</form>
			</Form>
		</FormSheet>
	);
}
