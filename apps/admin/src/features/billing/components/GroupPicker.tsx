import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';

import { Button, cn, Input, Popover, PopoverContent, PopoverTrigger } from '@repo/ui';

import { useGroup, useGroupList } from '@/features/groups/api/groups.queries';

interface GroupPickerProps {
	value: number | undefined;
	onChange: (groupId: number) => void;
	disabled?: boolean;
}

/**
 * Searchable single-select group picker. The groups list API has no text-search
 * param (unlike students), so we fetch a branch-scoped page and filter locally;
 * no `Combobox` primitive exists yet in `@repo/ui`. All statuses are shown —
 * invoices can belong to a completed group's historical enrollments too.
 */
export function GroupPicker({ value, onChange, disabled }: GroupPickerProps) {
	const [open, setOpen] = useState(false);
	const [input, setInput] = useState('');

	const { data: selected } = useGroup(value ?? 0);
	const { data, isLoading } = useGroupList({ limit: 100 });

	const query = input.trim().toLowerCase();
	const filtered = useMemo(() => {
		const rows = data?.rows ?? [];
		return query
			? rows.filter(
					(g) =>
						g.name.toLowerCase().includes(query) ||
						g.courseName.toLowerCase().includes(query),
				)
			: rows;
	}, [data, query]);

	function pick(id: number) {
		onChange(id);
		setOpen(false);
		setInput('');
	}

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					type="button"
					variant="outline"
					disabled={disabled}
					className={cn(
						'w-full justify-start font-normal',
						!selected && 'text-muted-foreground',
					)}
				>
					{selected
						? `${selected.name} · ${selected.courseName}`
						: 'Select group…'}
				</Button>
			</PopoverTrigger>
			<PopoverContent
				className="w-[var(--radix-popover-trigger-width)] p-0"
				align="start"
			>
				<div className="flex items-center gap-2 border-b border-border px-3 py-2">
					<Search className="size-4 shrink-0 text-muted-foreground" />
					<Input
						value={input}
						onChange={(e) => setInput(e.target.value)}
						placeholder="Search by group or course…"
						className="h-8 border-0 px-0 shadow-none focus-visible:ring-0"
						autoFocus
					/>
				</div>
				<div className="max-h-64 overflow-y-auto p-1">
					{isLoading ? (
						<div className="px-3 py-4 text-sm text-muted-foreground">
							Loading…
						</div>
					) : filtered.length === 0 ? (
						<div className="px-3 py-4 text-center text-sm text-muted-foreground">
							No matching groups.
						</div>
					) : (
						filtered.map((g) => (
							<button
								key={g.id}
								type="button"
								onClick={() => pick(g.id)}
								className={cn(
									'flex w-full flex-col rounded-md px-3 py-2 text-left text-sm hover:bg-muted',
									g.id === value && 'bg-muted',
								)}
							>
								<span className="font-medium">{g.name}</span>
								<span className="text-xs text-muted-foreground">
									{g.courseName}
								</span>
							</button>
						))
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
