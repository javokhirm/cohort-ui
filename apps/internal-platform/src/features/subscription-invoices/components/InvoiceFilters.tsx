import { X } from 'lucide-react';

import {
	Button,
	DatePicker,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui';

import type { SubscriptionInvoiceStatus } from '@/api/subscription-invoices/types';
import { useAppT } from '@/locales';

import { buildStatusOptions } from '../constants';

export interface InvoiceFilterValues {
	status?: SubscriptionInvoiceStatus;
	from?: string;
	to?: string;
}

const ALL = 'all';

export function InvoiceFilters({
	values,
	onChange,
}: {
	values: InvoiceFilterValues;
	onChange: (patch: Partial<InvoiceFilterValues>) => void;
}) {
	const t = useAppT('invoices');
	const hasFilters =
		Boolean(values.status) || Boolean(values.from) || Boolean(values.to);

	return (
		<div className="flex flex-wrap items-center gap-2">
			<Select
				value={values.status ?? ALL}
				onValueChange={(v) =>
					onChange({
						status: v === ALL ? undefined : (v as SubscriptionInvoiceStatus),
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
						onChange({ status: undefined, from: undefined, to: undefined })
					}
				>
					<X className="size-4" />
					{t('filter.clear')}
				</Button>
			)}
		</div>
	);
}
