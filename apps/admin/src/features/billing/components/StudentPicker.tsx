import { useEffect, useState } from 'react';
import { Search } from 'lucide-react';

import { Button, cn, Input, Popover, PopoverContent, PopoverTrigger } from '@repo/ui';

import { useStudent, useStudents } from '@/features/people/api/students.queries';

interface StudentPickerProps {
	value: number | undefined;
	onChange: (studentId: number) => void;
	disabled?: boolean;
}

/** Searchable single-select student picker — no `Combobox` primitive exists yet in `@repo/ui`. */
export function StudentPicker({ value, onChange, disabled }: StudentPickerProps) {
	const [open, setOpen] = useState(false);
	const [input, setInput] = useState('');
	const [search, setSearch] = useState('');

	// Debounce the search box (async setState — not a synchronous effect write).
	useEffect(() => {
		const t = setTimeout(() => setSearch(input.trim()), 300);
		return () => clearTimeout(t);
	}, [input]);

	const { data: selected } = useStudent(value ?? 0);
	const { data, isLoading } = useStudents({
		status: 'ACTIVE',
		search: search || undefined,
		limit: 20,
	});
	const students = data?.rows ?? [];

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
						? `${selected.user.firstName} ${selected.user.lastName} · ${selected.studentCode}`
						: 'Select student…'}
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
						placeholder="Search by name or code…"
						className="h-8 border-0 px-0 shadow-none focus-visible:ring-0"
						autoFocus
					/>
				</div>
				<div className="max-h-64 overflow-y-auto p-1">
					{isLoading ? (
						<div className="px-3 py-4 text-sm text-muted-foreground">
							Loading…
						</div>
					) : students.length === 0 ? (
						<div className="px-3 py-4 text-center text-sm text-muted-foreground">
							No matching students.
						</div>
					) : (
						students.map((s) => (
							<button
								key={s.id}
								type="button"
								onClick={() => pick(s.id)}
								className={cn(
									'flex w-full flex-col rounded-md px-3 py-2 text-left text-sm hover:bg-muted',
									s.id === value && 'bg-muted',
								)}
							>
								<span className="font-medium">
									{s.user.firstName} {s.user.lastName}
								</span>
								<span className="font-mono text-xs text-muted-foreground">
									{s.studentCode}
								</span>
							</button>
						))
					)}
				</div>
			</PopoverContent>
		</Popover>
	);
}
