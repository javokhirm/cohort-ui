import { useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	Badge,
	Button,
	Checkbox,
	FieldGroup,
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	FormSelect,
	Input,
	Label,
	Spinner,
	Switch,
	toast,
} from '@repo/ui';
import { useT } from '@repo/i18n';
import { isApiError } from '@repo/api-client';

import { FormSection } from '@/components/FormSection';
import { FormSheet } from '@/components/FormSheet';
import { useAppT } from '@/locales';

import {
	NOTIFICATION_CHANNELS,
	useNotificationTriggers,
	type NotificationChannel,
	type NotificationRule,
} from '../api/notifications.queries';
import {
	useCreateNotificationRule,
	useUpdateNotificationRule,
} from '../api/notifications.mutations';
import { ruleFormSchema, type RuleFormValues } from '../schemas/rule-form.schema';

interface RuleFormProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	/** Present = edit; absent = create. */
	rule?: NotificationRule;
	/** When editing, surfaces a destructive delete action in the sheet footer. */
	onDelete?: () => void;
}

/**
 * The rule builder.
 *
 * Everything trigger-specific is read from the server-served catalog
 * (`GET /manage/notification-triggers`): which audiences are offered, whether the
 * day-offset field appears, and which `{{variables}}` the chosen template may use.
 * Adding a trigger on the backend therefore needs no change here.
 *
 * `trigger` is immutable on the backend, so the select is disabled when editing
 * rather than hidden — staff still need to see which event a rule reacts to.
 *
 * The template is likewise never user-set here: it is always the trigger's
 * resolved template (its `defaultTemplateCode`, or, once saved, whatever the
 * rule already carries) and is shown read-only next to the event that determines
 * it. Customizing what a code actually renders happens in the Templates tab, not
 * per rule.
 */
export function RuleForm({ open, onOpenChange, rule, onDelete }: RuleFormProps) {
	const tn = useAppT('notifications');
	const tv = useT('validation');
	const tc = useT('common');

	const { data: triggers, isLoading: triggersLoading } = useNotificationTriggers();
	const createRule = useCreateNotificationRule();
	const updateRule = useUpdateNotificationRule();
	const isEdit = rule !== undefined;

	const schema = useMemo(() => ruleFormSchema(tv, tn), [tv, tn]);

	const form = useForm<RuleFormValues>({
		resolver: zodResolver(schema),
		defaultValues: {
			trigger: '',
			channels: ['SMS'],
			audience: 'PRIMARY_GUARDIAN',
			offsetDays: null,
			isActive: true,
		},
	});

	// Re-seed on open so a reopened sheet never shows the previous rule's values.
	useEffect(() => {
		if (!open) return;
		form.reset(
			rule
				? {
						trigger: rule.trigger,
						channels: rule.channels,
						audience: rule.audience,
						offsetDays: rule.offsetDays,
						isActive: rule.isActive,
					}
				: {
						trigger: triggers?.[0]?.trigger ?? '',
						channels: ['SMS'],
						audience: 'PRIMARY_GUARDIAN',
						offsetDays: null,
						isActive: true,
					},
		);
	}, [open, rule, triggers, form]);

	const selectedTrigger = form.watch('trigger');
	const definition = triggers?.find((t) => t.trigger === selectedTrigger);
	// The template a saved rule already carries wins over the trigger's default —
	// a rule created before this became read-only may still hold a custom code.
	const resolvedTemplateCode = rule?.templateCode ?? definition?.defaultTemplateCode;

	/**
	 * Keep the audience legal for the selected trigger. Switching to a subscription
	 * trigger while `STUDENT` is selected would otherwise submit a combination the
	 * backend rejects — better to correct it as the trigger changes than to explain
	 * a 400 afterwards.
	 */
	useEffect(() => {
		if (!definition) return;
		const current = form.getValues('audience');
		if (!definition.audiences.includes(current)) {
			form.setValue('audience', definition.audiences[0]);
		}
		// A SCHEDULED trigger needs an offset and an EVENT one must not have it.
		const offset = form.getValues('offsetDays');
		if (definition.requiresOffset && offset == null) form.setValue('offsetDays', -3);
		if (!definition.requiresOffset && offset != null)
			form.setValue('offsetDays', null);
	}, [definition, form]);

	const triggerOptions = useMemo(
		() => (triggers ?? []).map((t) => ({ value: t.trigger, label: t.label })),
		[triggers],
	);

	const audienceOptions = useMemo(
		() =>
			(definition?.audiences ?? []).map((audience) => ({
				value: audience,
				label: tn(`audience.${audience}`),
			})),
		[definition, tn],
	);

	const isSubmitting = createRule.isPending || updateRule.isPending;

	const onSubmit = async (values: RuleFormValues) => {
		// `templateCode` is never sent: the backend defaults a new rule to the
		// trigger's `defaultTemplateCode`, and omitting it on update leaves
		// whatever the rule already carries untouched — the template is read-only
		// here, never a value this form assigns.
		try {
			if (isEdit) {
				await updateRule.mutateAsync({
					id: rule.id,
					channels: values.channels,
					audience: values.audience,
					offsetDays: values.offsetDays ?? null,
					isActive: values.isActive,
				});
				toast.success(tn('rules.updated'));
			} else {
				await createRule.mutateAsync({
					trigger: values.trigger,
					channels: values.channels,
					audience: values.audience,
					offsetDays: values.offsetDays ?? null,
					isActive: values.isActive,
				});
				toast.success(tn('rules.created'));
			}
			onOpenChange(false);
		} catch (err) {
			// The API returns `error.message` already translated (we send `x-lang`),
			// so surface it directly rather than mapping codes here — that is where
			// the backend's audience/offset validation messages come from.
			toast.error(isApiError(err) ? err.message : tn('rules.saveFailed'));
		}
	};

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			title={isEdit ? tn('rules.edit') : tn('rules.add')}
			description={tn('rules.description')}
			maxWidth="lg"
			footer={
				<>
					{isEdit && onDelete && (
						<Button
							variant="outline"
							onClick={onDelete}
							disabled={isSubmitting}
							className="text-destructive hover:text-destructive"
						>
							{tc('action.delete')}
						</Button>
					)}
					<Button
						variant="outline"
						onClick={() => onOpenChange(false)}
						disabled={isSubmitting}
					>
						{tc('action.cancel')}
					</Button>
					<Button
						onClick={() => void form.handleSubmit(onSubmit)()}
						disabled={isSubmitting}
					>
						{isSubmitting && <Spinner className="mr-1.5 size-4" />}
						{tc('action.save')}
					</Button>
				</>
			}
		>
			{triggersLoading ? (
				<div className="flex items-center justify-center py-16 text-muted-foreground">
					<Spinner className="size-5" />
				</div>
			) : (
				<Form {...form}>
					<form
						onSubmit={(e) => {
							e.preventDefault();
							void form.handleSubmit(onSubmit)();
						}}
						className="flex flex-col gap-4"
					>
						<FormSection title={tn('rules.field.trigger')}>
							<FieldGroup>
								<FormSelect
									control={form.control}
									name="trigger"
									label={tn('rules.field.trigger')}
									options={triggerOptions}
									disabled={isEdit}
								/>
								{isEdit && (
									<p className="text-xs text-muted-foreground">
										{tn('rules.field.triggerHint')}
									</p>
								)}
							</FieldGroup>

							{resolvedTemplateCode && (
								<div className="flex flex-col gap-1.5">
									<Label className="text-muted-foreground">
										{tn('rules.field.templateCode')}
									</Label>
									<span className="font-mono text-sm font-semibold text-primary">
										{resolvedTemplateCode}
									</span>
									<p className="text-xs text-muted-foreground">
										{tn('rules.field.templateCodeHint')}
									</p>
								</div>
							)}

							{definition && definition.variables.length > 0 && (
								<div className="flex flex-col gap-2">
									<span className="text-xs text-muted-foreground">
										{tn('rules.variablesHint')}
									</span>
									<div className="flex flex-wrap gap-1">
										{definition.variables.map((variable) => (
											<Badge key={variable} variant="outline">
												{`{{${variable}}}`}
											</Badge>
										))}
									</div>
								</div>
							)}
						</FormSection>

						<FormSection title={tn('rules.field.channels')}>
							<FormField
								control={form.control}
								name="channels"
								render={({ field }) => (
									<FormItem>
										<FormLabel>
											{tn('rules.field.channels')}
										</FormLabel>
										<div className="flex flex-wrap gap-4">
											{NOTIFICATION_CHANNELS.map((channel) => {
												const selected = (
													field.value as NotificationChannel[]
												).includes(channel);
												return (
													<label
														key={channel}
														className="flex items-center gap-2 text-sm"
													>
														<Checkbox
															checked={selected}
															onCheckedChange={(
																checked,
															) => {
																const next = checked
																	? [
																			...(field.value as NotificationChannel[]),
																			channel,
																		]
																	: (
																			field.value as NotificationChannel[]
																		).filter(
																			(c) =>
																				c !==
																				channel,
																		);
																field.onChange(next);
															}}
														/>
														{tn(`channel.${channel}`)}
													</label>
												);
											})}
										</div>
										<FormMessage />
									</FormItem>
								)}
							/>

							<FieldGroup>
								<FormSelect
									control={form.control}
									name="audience"
									label={tn('rules.field.audience')}
									options={audienceOptions}
								/>
							</FieldGroup>
						</FormSection>

						{definition?.requiresOffset && (
							<FormSection title={tn('rules.column.timing')}>
								<FieldGroup>
									<FormField
										control={form.control}
										name="offsetDays"
										render={({ field }) => (
											<FormItem>
												<FormLabel>
													{tn('rules.field.offsetDays')}
												</FormLabel>
												<FormControl>
													<Input
														type="number"
														value={field.value ?? ''}
														onChange={(e) =>
															field.onChange(
																e.target.value === ''
																	? null
																	: Number(
																			e.target
																				.value,
																		),
															)
														}
													/>
												</FormControl>
												<p className="text-xs text-muted-foreground">
													{tn('rules.field.offsetDaysHint')}
												</p>
												<FormMessage />
											</FormItem>
										)}
									/>
								</FieldGroup>
							</FormSection>
						)}

						<FormSection>
							<FormField
								control={form.control}
								name="isActive"
								render={({ field }) => (
									<FormItem className="flex flex-row items-center justify-between gap-4">
										<div className="flex flex-col gap-0.5">
											<span className="text-sm font-semibold text-foreground">
												{tn('rules.field.isActive')}
											</span>
											<span className="text-xs text-muted-foreground">
												{tn('rules.field.isActiveHint')}
											</span>
										</div>
										<FormControl>
											<Switch
												checked={Boolean(field.value)}
												onCheckedChange={field.onChange}
											/>
										</FormControl>
									</FormItem>
								)}
							/>
						</FormSection>
					</form>
				</Form>
			)}
		</FormSheet>
	);
}
