import { useState } from 'react';
import { useNavigate, useSearch } from '@tanstack/react-router';
import { X } from 'lucide-react';

import {
	Button,
	Card,
	DatePicker,
	Label,
	PageHeader,
	Pagination,
	SearchFilterBar,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui';
import { useStatusLabel, useT } from '@repo/i18n';
import { useAppT } from '@/locales';

import { usePaymentList } from '../api/payments.queries';
import type { PaymentListFilters } from '../api/keys';
import { PAYMENT_METHOD_OPTIONS, PAYMENT_STATUS_FILTERS } from '../lib/payment-options';
import { PaymentDetailSheet } from '../components/PaymentDetailSheet';
import { PaymentTable } from '../components/PaymentTable';
import { StudentPicker } from '../components/StudentPicker';

const PAGE_SIZE = 20;
const ALL = 'all';

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

	const hasExtraFilters = method != null || studentId != null || !!from || !!to;

	function handleStatusChange(value: (typeof PAYMENT_STATUS_FILTERS)[number]['value']) {
		void navigate({
			search: (prev) => ({ ...prev, status: value, page: undefined }),
		});
	}

	function handleMethodChange(value: string) {
		void navigate({
			search: (prev) => ({
				...prev,
				method:
					value === ALL
						? undefined
						: (value as NonNullable<PaymentListFilters['method']>),
				page: undefined,
			}),
		});
	}

	function handleStudentChange(value: number | undefined) {
		void navigate({
			search: (prev) => ({ ...prev, studentId: value, page: undefined }),
		});
	}

	function handleDateChange(field: 'from' | 'to', value: string) {
		void navigate({
			search: (prev) => ({ ...prev, [field]: value || undefined, page: undefined }),
		});
	}

	function handleClearExtraFilters() {
		void navigate({
			search: (prev) => ({
				...prev,
				method: undefined,
				studentId: undefined,
				from: undefined,
				to: undefined,
				page: undefined,
			}),
		});
	}

	function handlePage(newPage: number) {
		void navigate({ search: (prev) => ({ ...prev, page: newPage }) });
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
				/>

				<div className="flex flex-wrap items-end gap-4">
					<div className="flex flex-col gap-1.5">
						<Label className="text-xs text-muted-foreground">
							{t('payments.column.method')}
						</Label>
						<Select value={method ?? ALL} onValueChange={handleMethodChange}>
							<SelectTrigger className="h-9 w-44" size="sm">
								<SelectValue placeholder={t('payments.allMethods')} />
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
					</div>
					<div className="flex flex-col gap-1.5">
						<Label className="text-xs text-muted-foreground">
							{t('payments.column.student')}
						</Label>
						<div className="w-56">
							<StudentPicker
								value={studentId}
								onChange={handleStudentChange}
							/>
						</div>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label
							htmlFor="payment-from"
							className="text-xs text-muted-foreground"
						>
							{t('misc.paidFrom')}
						</Label>
						<DatePicker
							id="payment-from"
							value={from}
							onChange={(value) => handleDateChange('from', value ?? '')}
							className="h-9 w-37.5"
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label
							htmlFor="payment-to"
							className="text-xs text-muted-foreground"
						>
							{t('misc.paidTo')}
						</Label>
						<DatePicker
							id="payment-to"
							value={to}
							onChange={(value) => handleDateChange('to', value ?? '')}
							className="h-9 w-37.5"
						/>
					</div>
					{hasExtraFilters && (
						<Button
							variant="ghost"
							size="sm"
							onClick={handleClearExtraFilters}
						>
							<X className="mr-1.5 size-3.5" />
							{t('misc.clearFilters')}
						</Button>
					)}
				</div>

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
