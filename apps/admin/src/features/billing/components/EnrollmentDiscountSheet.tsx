import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';

import {
	Button,
	cn,
	Form,
	FormDatePicker,
	FormField,
	FormItem,
	FormMessage,
	RadioGroup,
	RadioGroupItem,
	Skeleton,
	Spinner,
	toast,
} from '@repo/ui';
import { formatDate } from '@repo/utils';

import { FormSection } from '@/components/FormSection';
import { FormSheet } from '@/components/FormSheet';

import { useDiscountList } from '../api/discounts.queries';
import type { EnrollmentDiscountResponse } from '../api/enrollment-discounts.queries';
import {
	useAssignEnrollmentDiscount,
	useRevokeEnrollmentDiscount,
} from '../api/enrollment-discounts.mutations';
import {
	assignEnrollmentDiscountSchema,
	type AssignEnrollmentDiscountFormValues,
} from '../schemas/enrollment-discount-form.schema';
import { formatDiscountValue } from '../lib/discount-options';

interface EnrollmentDiscountSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	enrollmentId: number;
	/** The enrollment's group name, shown as the sheet subtitle. */
	groupName: string;
	/** The enrollment's current standing assignments. */
	assignments: EnrollmentDiscountResponse[];
}

const EMPTY_FORM: AssignEnrollmentDiscountFormValues = {
	discountId: '',
	validUntil: '',
};

/**
 * Manage an enrollment's standing discounts (api-reference §3.13a). Lists the
 * current assignments (each individually removable) and adds new ones — an
 * enrollment may carry several. Gated to `enrollment.discount.manage`, so only
 * render it behind that permission (the backend enforces it regardless).
 */
export function EnrollmentDiscountSheet({
	open,
	onOpenChange,
	enrollmentId,
	groupName,
	assignments,
}: EnrollmentDiscountSheetProps) {
	const form = useForm<AssignEnrollmentDiscountFormValues>({
		resolver: zodResolver(assignEnrollmentDiscountSchema),
		defaultValues: EMPTY_FORM,
	});

	const { data: discountData, isLoading } = useDiscountList({
		isActive: true,
		limit: 100,
	});
	const assign = useAssignEnrollmentDiscount();
	const revoke = useRevokeEnrollmentDiscount();

	// Reset the add-form whenever the sheet closes so the next open starts clean.
	useEffect(() => {
		if (!open) form.reset(EMPTY_FORM);
	}, [open, form]);

	// A discount already assigned to this enrollment can't be added again
	// (the backend rejects a duplicate), so drop those from the picker.
	const assignedIds = new Set(assignments.map((a) => a.discountId));
	const options = (discountData?.rows ?? [])
		.filter((d) => !assignedIds.has(d.id))
		.map((d) => ({
			value: String(d.id),
			label: `${d.name} (${formatDiscountValue(d.type, d.value)})`,
		}));

	async function onSubmit(values: AssignEnrollmentDiscountFormValues) {
		await assign.mutateAsync({
			enrollmentId,
			discountId: Number(values.discountId),
			validUntil: values.validUntil === '' ? null : values.validUntil,
		});
		toast.success('Standing discount assigned');
		form.reset(EMPTY_FORM);
	}

	function handleRevoke(assignment: EnrollmentDiscountResponse) {
		if (!confirm(`Remove the "${assignment.discountName}" standing discount?`))
			return;
		revoke.mutate(
			{ enrollmentId, assignmentId: assignment.id },
			{ onSuccess: () => toast.success('Standing discount removed') },
		);
	}

	return (
		<FormSheet
			open={open}
			onOpenChange={onOpenChange}
			title="Standing discount"
			description={groupName}
			footer={
				<>
					<Button
						type="button"
						variant="outline"
						onClick={() => onOpenChange(false)}
					>
						Cancel
					</Button>
					<Button
						type="submit"
						form="assign-enrollment-discount-form"
						disabled={assign.isPending || options.length === 0}
					>
						{assign.isPending && <Spinner className="mr-2 size-4" />}
						Save discount
					</Button>
				</>
			}
		>
			<div className="flex flex-col gap-4">
				<div className="rounded-xl bg-card p-4 text-xs leading-relaxed text-muted-foreground">
					Applies automatically to this enrollment&rsquo;s monthly invoice —
					every month, until it expires. Usage caps on the underlying promo are
					not consumed by standing assignments.
				</div>

				{assignments.length > 0 && (
					<FormSection>
						<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
							Current
						</p>
						<div className="flex flex-col gap-2">
							{assignments.map((a) => (
								<div
									key={a.id}
									className="flex items-center justify-between rounded-lg border p-3"
								>
									<div>
										<p className="text-sm font-medium">
											{a.discountName}
										</p>
										<p className="mt-0.5 text-xs text-muted-foreground">
											{formatDiscountValue(
												a.discountType,
												a.discountValue,
											)}
											{a.validUntil
												? ` · until ${formatDate(a.validUntil)}`
												: ' · no end date'}
										</p>
									</div>
									<Button
										type="button"
										variant="ghost"
										size="icon"
										className="text-muted-foreground hover:text-destructive"
										onClick={() => handleRevoke(a)}
										disabled={revoke.isPending}
										aria-label={`Remove ${a.discountName}`}
									>
										<Trash2 className="size-4" />
									</Button>
								</div>
							))}
						</div>
					</FormSection>
				)}

				<Form {...form}>
					<form
						id="assign-enrollment-discount-form"
						onSubmit={(e) => void form.handleSubmit(onSubmit)(e)}
						className="flex flex-col gap-4"
					>
						<FormSection>
							<p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
								Add discount
							</p>
							{isLoading ? (
								<Skeleton className="h-24 rounded-lg" />
							) : options.length === 0 ? (
								<p className="text-sm text-muted-foreground">
									{assignments.length > 0
										? 'Every active discount is already assigned to this enrollment.'
										: 'No active discounts to assign — create one under Discounts first.'}
								</p>
							) : (
								<FormField
									control={form.control}
									name="discountId"
									render={({ field }) => (
										<FormItem>
											<RadioGroup
												value={field.value}
												onValueChange={field.onChange}
												className="gap-2"
											>
												{options.map((o) => {
													const selected =
														field.value === o.value;
													return (
														<label
															key={o.value}
															className={cn(
																'flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors',
																selected
																	? 'border-primary bg-primary/5'
																	: 'border-input hover:bg-muted',
															)}
														>
															<RadioGroupItem
																value={o.value}
															/>
															<span className="text-sm font-medium">
																{o.label}
															</span>
														</label>
													);
												})}
											</RadioGroup>
											<FormMessage />
										</FormItem>
									)}
								/>
							)}
						</FormSection>

						{options.length > 0 && (
							<FormSection>
								<FormDatePicker
									control={form.control}
									name="validUntil"
									label="Valid until"
								/>
								<p className="text-xs text-muted-foreground">
									Applied to every monthly invoice generated before this
									date. Leave blank for no end date.
								</p>
							</FormSection>
						)}
					</form>
				</Form>
			</div>
		</FormSheet>
	);
}
