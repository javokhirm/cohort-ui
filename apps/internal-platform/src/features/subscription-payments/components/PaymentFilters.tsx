import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';

import {
	Button,
	DatePicker,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui';

import type {
	SubscriptionPaymentMethod,
	SubscriptionPaymentStatus,
} from '@/api/subscription-payments/types';
import { useAppT } from '@/locales';

import { buildMethodOptions, buildStatusOptions } from '../constants';

export interface PaymentFilterValues {
	search?: string;
	status?: SubscriptionPaymentStatus;
	method?: SubscriptionPaymentMethod;
	from?: string;
	to?: string;
}

/** Patch to apply to the URL search params; keys set to `undefined` are cleared. */
export type PaymentFilterPatch = Partial<PaymentFilterValues>;

const ALL = 'all';

export function PaymentFilters({
	values,
	onChange,
}: {
	values: PaymentFilterValues;
	onChange: (patch: PaymentFilterPatch) => void;
}) {
	const t = useAppT('payments');
	const [searchInput, setSearchInput] = useState(values.search ?? '');

	// Keep the input in step when the URL search changes externally (clear, back
	// nav) via React's render-time "adjust state" pattern rather than an effect.
	const [syncedSearch, setSyncedSearch] = useState(values.search);
	if (values.search !== syncedSearch) {
		setSyncedSearch(values.search);
		setSearchInput(values.search ?? '');
	}

	// Debounce the free-text search so each keystroke isn't a new query.
	useEffect(() => {
		const timer = setTimeout(() => {
			const trimmed = searchInput.trim() || undefined;
			if (trimmed === (values.search || undefined)) return;
			onChange({ search: trimmed });
		}, 350);
		return () => clearTimeout(timer);
	}, [searchInput]); // eslint-disable-line react-hooks/exhaustive-deps

	const hasFilters =
		Boolean(values.search) ||
		Boolean(values.status) ||
		Boolean(values.method) ||
		Boolean(values.from) ||
		Boolean(values.to);

	return (
		<div className="flex flex-wrap items-center gap-2">
			<div className="relative min-w-64 flex-1">
				<Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					value={searchInput}
					onChange={(e) => setSearchInput(e.target.value)}
					placeholder={t('searchPlaceholder')}
					className="pl-9"
				/>
			</div>

			<Select
				value={values.status ?? ALL}
				onValueChange={(v) =>
					onChange({
						status: v === ALL ? undefined : (v as SubscriptionPaymentStatus),
					})
				}
			>
				<SelectTrigger className="w-40">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{buildStatusOptions(t).map((o) => (
						<SelectItem key={o.value} value={o.value}>
							{o.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				value={values.method ?? ALL}
				onValueChange={(v) =>
					onChange({
						method: v === ALL ? undefined : (v as SubscriptionPaymentMethod),
					})
				}
			>
				<SelectTrigger className="w-40">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{buildMethodOptions(t).map((o) => (
						<SelectItem key={o.value} value={o.value}>
							{o.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<DatePicker
				value={values.from}
				onChange={(v) => onChange({ from: v })}
				placeholder={t('filter.from')}
				maxDate={values.to}
				className="w-40"
			/>
			<DatePicker
				value={values.to}
				onChange={(v) => onChange({ to: v })}
				placeholder={t('filter.to')}
				minDate={values.from}
				className="w-40"
			/>

			{hasFilters && (
				<Button
					variant="ghost"
					size="sm"
					onClick={() =>
						onChange({
							search: undefined,
							status: undefined,
							method: undefined,
							from: undefined,
							to: undefined,
						})
					}
				>
					<X className="size-4" />
					{t('filter.clear')}
				</Button>
			)}
		</div>
	);
}
