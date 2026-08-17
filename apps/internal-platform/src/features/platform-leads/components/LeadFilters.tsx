import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';

import {
	Button,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui';

import { useAppT } from '@/locales';
import { buildSourceOptions } from '../constants';

export interface LeadFilterValues {
	search?: string;
	source?: string;
}

/** Patch to apply to the URL search params; keys set to `undefined` are cleared. */
export type LeadFilterPatch = Partial<LeadFilterValues>;

const ALL = 'all';

export function LeadFilters({
	values,
	onChange,
}: {
	values: LeadFilterValues;
	onChange: (patch: LeadFilterPatch) => void;
}) {
	const t = useAppT('leads');
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

	const hasFilters = Boolean(values.search) || Boolean(values.source);

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
				value={values.source ?? ALL}
				onValueChange={(v) => onChange({ source: v === ALL ? undefined : v })}
			>
				<SelectTrigger className="w-44">
					<SelectValue />
				</SelectTrigger>
				<SelectContent>
					{buildSourceOptions(t).map((o) => (
						<SelectItem key={o.value} value={o.value}>
							{o.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			{hasFilters && (
				<Button
					variant="ghost"
					size="sm"
					onClick={() => onChange({ search: undefined, source: undefined })}
				>
					<X className="size-4" />
					{t('filter.clear')}
				</Button>
			)}
		</div>
	);
}
