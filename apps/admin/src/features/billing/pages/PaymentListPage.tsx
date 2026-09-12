import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { X } from 'lucide-react';

import {
	ActiveFilterChips,
	Button,
	Card,
	DatePicker,
	PageHeader,
	Pagination,
	SearchFilterBar,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
	type ActiveFilterChip,
} from '@repo/ui';
import { formatDate } from '@repo/utils';
import { useStatusLabel, useT } from '@repo/i18n';
import { useAppT } from '@/locales';

import { FilterField } from '@/components/FilterField';
import { FilterSheet } from '@/components/FilterSheet';
import { useStudent } from '@/features/people/api/students.queries';
import { usePaymentList } from '../api/payments.queries';
import type { PaymentListFilters } from '../api/keys';
import { PAYMENT_METHOD_OPTIONS, PAYMENT_STATUS_FILTERS } from '../lib/payment-options';
import { PaymentDetailSheet } from '../components/PaymentDetailSheet';
import { PaymentTable } from '../components/PaymentTable';
import { StudentPicker } from '../components/StudentPicker';

const PAGE_SIZE = 20;
const ALL = 'all';

/** The scope filters — everything the toolbar narrows by except the status chips. */
type PaymentScopeFilters = Pick<
	PaymentListFilters,
	'method' | 'studentId' | 'from' | 'to'
>;

export function PaymentListPage() {
	const t = useAppT('billing');
	const tc = useT('common');
	const statusLabel = useStatusLabel();
	const navigate = useNavigate({ from: '/payments' });
	const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);
	const {
		page = 1,
		status,
		method,
		studentId,
		from,
		to,
	} = useSearch({
		from: '/_authed/payments',
	});

	/** The filter sheet's pending edits — only reaches the URL on Apply. */
	const [draft, setDraft] = useState<PaymentScopeFilters>({
		method,
		studentId,
		from,
		to,
	});

	const filters: PaymentListFilters = {
		page,
		limit: PAGE_SIZE,
		status,
		method,
		studentId,
		from,
		to,
	};

	const { data, isLoading, isError } = usePaymentList(filters);
	const payments = data?.rows ?? [];
	const total = data?.total ?? 0;

	const { data: selectedStudent } = useStudent(studentId ?? 0);

	function patchFilters(patch: Partial<PaymentScopeFilters>) {
		void navigate({
			search: (prev) => ({ ...prev, ...patch, page: undefined }),
		});
	}

	function handleStatusChange(value: (typeof PAYMENT_STATUS_FILTERS)[number]['value']) {
		void navigate({
			search: (prev) => ({ ...prev, status: value, page: undefined }),
		});
	}

	/** One meaning of "clear", everywhere it is offered: nothing left narrowing the list. */
	function handleClearFilters() {
		void navigate({
			search: () => ({}),
		});
	}

	/** Resyncs the sheet's draft from applied state whenever it opens, so a cancelled edit never lingers. */
	function handleFilterSheetOpenChange(open: boolean) {
		if (open) {
			setDraft({ method, studentId, from, to });
		}
	}

	function handleApplyFilters() {
		patchFilters(draft);
	}

	/** Clears the sheet's draft only — still requires Apply to take effect. */
	function handleResetDraft() {
		setDraft({
			method: undefined,
			studentId: undefined,
			from: undefined,
			to: undefined,
		});
	}

	const draftActive =
		draft.method != null || draft.studentId != null || !!draft.from || !!draft.to;

	function handlePage(newPage: number) {
		void navigate({ search: (prev) => ({ ...prev, page: newPage }) });
	}

	/**
	 * One chip per applied scope filter. The paid-date range is a single chip
	 * even though it is two controls — the count on the Filters trigger is taken
	 * from this list, so the badge and the chips can never disagree.
	 */
	const chips: ActiveFilterChip[] = [];
	const toChip = (
		id: string,
		label: string,
		value: string,
		onRemove: () => void,
	): ActiveFilterChip => ({
		id,
		label,
		value,
		removeLabel: t('payments.filters.remove', { filter: label }),
		onRemove,
	});

	if (studentId != null) {
		chips.push(
			toChip(
				'student',
				t('payments.column.student'),
				selectedStudent
					? `${selectedStudent.user.firstName} ${selectedStudent.user.lastName}`
					: tc('state.loading'),
				() => patchFilters({ studentId: undefined }),
			),
		);
	}

	if (method != null) {
		chips.push(
			toChip(
				'method',
				t('payments.column.method'),
				t(`paymentMethod.${method}`),
				() => patchFilters({ method: undefined }),
			),
		);
	}

	const paidRange =
		from && to
			? t('payments.filters.rangeBoth', {
					from: formatDate(from),
					to: formatDate(to),
				})
			: from
				? t('payments.filters.rangeFrom', { from: formatDate(from) })
				: to
					? t('payments.filters.rangeTo', { to: formatDate(to) })
					: null;

	if (paidRange) {
		chips.push(
			toChip('paid', t('payments.column.date'), paidRange, () =>
				patchFilters({ from: undefined, to: undefined }),
			),
		);
	}

	return (
		<div className="mx-auto flex max-w-7xl flex-col gap-6">
			<PageHeader
				title={t('payments.title')}
				description={t('payments.description')}
			/>

			<div className="flex flex-col gap-4">
				<SearchFilterBar
					filters={PAYMENT_STATUS_FILTERS.map((f) => ({
						id: f.value ?? 'ALL',
						label: f.value
							? statusLabel('payment', f.value)
							: tc('state.all'),
						active: status === f.value,
						onClick: () => handleStatusChange(f.value),
					}))}
					actions={
						<FilterSheet
							label={t('payments.filters.title')}
							count={chips.length}
							onOpenChange={handleFilterSheetOpenChange}
							onApply={handleApplyFilters}
							resetAction={
								draftActive && (
									<Button
										type="button"
										variant="ghost"
										size="sm"
										onClick={handleResetDraft}
									>
										<X className="mr-1.5 size-3.5" />
										{t('misc.clearFilters')}
									</Button>
								)
							}
						>
							<FilterField label={t('payments.column.method')}>
								<Select
									value={draft.method ?? ALL}
									onValueChange={(value) =>
										setDraft((prev) => ({
											...prev,
											method:
												value === ALL
													? undefined
													: (value as NonNullable<
															PaymentListFilters['method']
														>),
										}))
									}
								>
									<SelectTrigger className="w-full" size="sm">
										<SelectValue
											placeholder={t('payments.allMethods')}
										/>
									</SelectTrigger>
									<SelectContent>
										<SelectItem value={ALL}>
											{t('payments.allMethods')}
										</SelectItem>
										{PAYMENT_METHOD_OPTIONS.map((o) => (
											<SelectItem key={o.value} value={o.value}>
												{t(`paymentMethod.${o.value}`)}
											</SelectItem>
										))}
									</SelectContent>
								</Select>
							</FilterField>
							<FilterField label={t('payments.column.student')}>
								<StudentPicker
									value={draft.studentId}
									onChange={(value) =>
										setDraft((prev) => ({
											...prev,
											studentId: value,
										}))
									}
									onClear={() =>
										setDraft((prev) => ({
											...prev,
											studentId: undefined,
										}))
									}
								/>
							</FilterField>
							<div className="flex gap-3">
								<FilterField
									label={t('misc.paidFrom')}
									htmlFor="payment-from"
									className="flex-1"
								>
									<DatePicker
										id="payment-from"
										value={draft.from}
										maxDate={draft.to}
										onChange={(value) =>
											setDraft((prev) => ({ ...prev, from: value }))
										}
									/>
								</FilterField>
								<FilterField
									label={t('misc.paidTo')}
									htmlFor="payment-to"
									className="flex-1"
								>
									<DatePicker
										id="payment-to"
										value={draft.to}
										minDate={draft.from}
										onChange={(value) =>
											setDraft((prev) => ({ ...prev, to: value }))
										}
									/>
								</FilterField>
							</div>
						</FilterSheet>
					}
				/>

				<ActiveFilterChips
					chips={chips}
					action={
						<Button variant="ghost" size="sm" onClick={handleClearFilters}>
							<X className="mr-1.5 size-3.5" />
							{t('misc.clearFilters')}
						</Button>
					}
				/>

				{isError && (
					<div className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
						{t('payments.loadError')}
					</div>
				)}

				<Card className="gap-0 overflow-hidden py-0">
					<PaymentTable
						payments={payments}
						isLoading={isLoading}
						onRowClick={(payment) => setSelectedPaymentId(payment.id)}
					/>
					<div className="border-t border-border px-4 py-3">
						<Pagination
							page={page}
							pageSize={PAGE_SIZE}
							total={total}
							onPageChange={handlePage}
						/>
					</div>
				</Card>
			</div>

			<PaymentDetailSheet
				paymentId={selectedPaymentId}
				open={selectedPaymentId != null}
				onOpenChange={(open) => {
					if (!open) setSelectedPaymentId(null);
				}}
			/>
		</div>
	);
}
