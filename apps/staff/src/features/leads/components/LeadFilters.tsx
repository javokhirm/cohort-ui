import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

import {
	Button,
	Input,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui';

import { useCourseList } from '@/features/courses/api/courses.queries';
import { useStaffList } from '@/features/hr/api/staff.queries';

import type { LeadSource } from '../api/leads.queries';
import {
	LEAD_SOURCE_OPTIONS,
	TIME_WINDOW_OPTIONS,
	type TimeWindow,
} from '../lib/lead-options';

export interface LeadFilterValues {
	search?: string;
	source?: LeadSource;
	assignedToStaffId?: number;
	courseInterestId?: number;
	window?: TimeWindow;
}

interface LeadFiltersProps {
	values: LeadFilterValues;
	onChange: (patch: Partial<LeadFilterValues>) => void;
	onClear: () => void;
}

const ALL = 'ALL';

export function LeadFilters({ values, onChange, onClear }: LeadFiltersProps) {
	const { data: staffData } = useStaffList({ limit: 100 });
	const { data: coursesData } = useCourseList({ limit: 100 });

	const [input, setInput] = useState(values.search ?? '');
	// Sync the field when the URL search changes externally (Clear, back/forward)
	// by adjusting state during render — the effect-free pattern React recommends.
	const [lastExternal, setLastExternal] = useState(values.search);
	if (values.search !== lastExternal) {
		setLastExternal(values.search);
		setInput(values.search ?? '');
	}
	useEffect(() => {
		const t = setTimeout(() => {
			const next = input.trim() || undefined;
			if (next !== values.search) onChange({ search: next });
		}, 300);
		return () => clearTimeout(t);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [input]);

	const staff = staffData?.rows ?? [];
	const courses = coursesData?.rows ?? [];

	const hasFilters =
		!!values.search ||
		!!values.source ||
		values.assignedToStaffId != null ||
		values.courseInterestId != null ||
		!!values.window;

	return (
		<div className="flex flex-wrap items-center gap-2">
			<div className="relative w-60">
				<Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
				<Input
					value={input}
					onChange={(e) => setInput(e.target.value)}
					placeholder="Search name or phone…"
					className="h-9 pl-9"
				/>
			</div>

			<Select
				className="w-auto"
				value={values.source ?? ALL}
				onValueChange={(v) =>
					onChange({ source: v === ALL ? undefined : (v as LeadSource) })
				}
			>
				<SelectTrigger size="sm" className="w-36">
					<SelectValue placeholder="All sources" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL}>All sources</SelectItem>
					{LEAD_SOURCE_OPTIONS.map((o) => (
						<SelectItem key={o.value} value={o.value}>
							{o.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				className="w-auto"
				value={
					values.assignedToStaffId != null
						? String(values.assignedToStaffId)
						: ALL
				}
				onValueChange={(v) =>
					onChange({ assignedToStaffId: v === ALL ? undefined : Number(v) })
				}
			>
				<SelectTrigger size="sm" className="w-40">
					<SelectValue placeholder="All staff" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL}>All staff</SelectItem>
					{staff.map((s) => (
						<SelectItem key={s.id} value={String(s.id)}>
							{s.user.firstName} {s.user.lastName}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				className="w-auto"
				value={
					values.courseInterestId != null
						? String(values.courseInterestId)
						: ALL
				}
				onValueChange={(v) =>
					onChange({ courseInterestId: v === ALL ? undefined : Number(v) })
				}
			>
				<SelectTrigger size="sm" className="w-40">
					<SelectValue placeholder="All courses" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL}>All courses</SelectItem>
					{courses.map((c) => (
						<SelectItem key={c.id} value={String(c.id)}>
							{c.name}
						</SelectItem>
					))}
				</SelectContent>
			</Select>

			<Select
				className="w-auto"
				value={values.window ?? ALL}
				onValueChange={(v) =>
					onChange({ window: v === ALL ? undefined : (v as TimeWindow) })
				}
			>
				<SelectTrigger size="sm" className="w-36">
					<SelectValue placeholder="All time" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value={ALL}>All time</SelectItem>
					{TIME_WINDOW_OPTIONS.map((o) => (
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
					className="text-muted-foreground"
					onClick={() => {
						setInput('');
						onClear();
					}}
				>
					Clear filters
				</Button>
			)}
		</div>
	);
}
