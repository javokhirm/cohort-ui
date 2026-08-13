import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import {
	Button,
	Checkbox,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormInput,
	FormItem,
	FormLabel,
	FormMessage,
	FormMoneyInput,
	Input,
	Label,
	Sheet,
	SheetContent,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from '@repo/ui';

import { ALL_FEATURES, featureLabel, featureDescription } from '../constants';
import {
	EMPTY_FORM,
	planSchema,
	planToFormValues,
	type DrawerMode,
	type PlanFormValues,
} from '../schemas';
import { useAppT } from '@/locales';
import { useT } from '@repo/i18n';

export function PlanDrawer({
	mode,
	open,
	onOpenChange,
	onSave,
	saving,
}: {
	mode: DrawerMode;
	open: boolean;
	onOpenChange: (open: boolean) => void;
	onSave: (values: PlanFormValues) => void;
	saving: boolean;
}) {
	const t = useAppT('plans');
	const tc = useT('common');
	const isEdit = mode.kind === 'edit';
	const defaultValues = isEdit ? planToFormValues(mode.plan) : EMPTY_FORM;

	const form = useForm<PlanFormValues>({
		resolver: zodResolver(planSchema),
		defaultValues,
	});

	useEffect(() => {
		if (open) {
			form.reset(defaultValues);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, mode]);

	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent
				side="right"
				className="w-[480px] sm:max-w-[480px] overflow-y-auto"
			>
				<SheetHeader className="pb-2">
					<SheetTitle>{isEdit ? t('editPlan') : t('create')}</SheetTitle>
				</SheetHeader>

				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSave)}
						className="flex flex-1 flex-col gap-5 px-4 py-2"
					>
						<FormInput
							control={form.control}
							name="name"
							label={t('planName')}
							placeholder={t('planNamePlaceholder')}
						/>

						<div className="grid grid-cols-2 gap-4">
							<FormMoneyInput
								control={form.control}
								name="priceMonthly"
								label={t('monthlyPrice')}
								placeholder="2400000"
							/>
							<FormMoneyInput
								control={form.control}
								name="priceAnnual"
								label={t('annualPrice')}
								placeholder="24000000"
							/>
						</div>

						<div className="grid grid-cols-2 gap-4">
							<FormField
								control={form.control}
								name="maxStudents"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('studentLimit')}</FormLabel>
										<FormControl>
											<Input
												min={0}
												placeholder="300"
												{...field}
												onChange={(e) =>
													field.onChange(Number(e.target.value))
												}
											/>
										</FormControl>
										<FormDescription>
											{t('unlimitedHint')}
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
							<FormField
								control={form.control}
								name="maxBranches"
								render={({ field }) => (
									<FormItem>
										<FormLabel>{t('branchLimit')}</FormLabel>
										<FormControl>
											<Input
												min={0}
												placeholder="5"
												{...field}
												onChange={(e) =>
													field.onChange(Number(e.target.value))
												}
											/>
										</FormControl>
										<FormDescription>
											{t('unlimitedHint')}
										</FormDescription>
										<FormMessage />
									</FormItem>
								)}
							/>
						</div>

						<div className="flex flex-col gap-3">
							<Label className="text-sm font-medium">
								{t('featuresIncluded')}
							</Label>
							{ALL_FEATURES.map((feature) => (
								<FormField
									key={feature}
									control={form.control}
									name={feature}
									render={({ field }) => (
										<FormItem className="flex items-start gap-3 space-y-0">
											<FormControl>
												<Checkbox
													checked={field.value as boolean}
													onCheckedChange={field.onChange}
													className="mt-0.5"
												/>
											</FormControl>
											<div>
												<FormLabel className="text-sm font-medium leading-none">
													{featureLabel(t, feature)}
												</FormLabel>
												<p className="mt-0.5 text-xs text-muted-foreground">
													{featureDescription(t, feature)}
												</p>
											</div>
										</FormItem>
									)}
								/>
							))}
						</div>

						<SheetFooter className="mt-auto flex flex-row gap-2 px-0 pb-0">
							<Button
								type="button"
								variant="outline"
								className="flex-1"
								onClick={() => onOpenChange(false)}
							>
								{tc('action.cancel')}
							</Button>
							<Button type="submit" className="flex-1" disabled={saving}>
								{saving
									? isEdit
										? t('saving')
										: t('creating')
									: isEdit
										? t('saveChanges')
										: t('create')}
							</Button>
						</SheetFooter>
					</form>
				</Form>
			</SheetContent>
		</Sheet>
	);
}
