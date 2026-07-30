import { cn } from '@repo/ui';

import type { StudentGroup } from '../api/groups.queries';
import { useAppT } from '@/locales';

interface GroupFilterChipsProps {
	groups: StudentGroup[];
	/** `undefined` = all groups. */
	selected: number | undefined;
	onSelect: (groupId: number | undefined) => void;
}

/**
 * The horizontal group filter per the design: an "All groups" chip followed by one chip
 * per enrolled group; the active chip is primary-tinted. Scrolls horizontally on phones.
 */
export function GroupFilterChips({ groups, selected, onSelect }: GroupFilterChipsProps) {
	const t = useAppT('progress');

	const chips: { key: number | undefined; label: string }[] = [
		{ key: undefined, label: t('allGroups') },
		...groups.map((g) => ({ key: g.id as number | undefined, label: g.name })),
	];

	return (
		<div className="flex gap-1.5 overflow-x-auto pb-3">
			{chips.map(({ key, label }) => {
				const active = selected === key;
				return (
					<button
						key={key ?? 'all'}
						type="button"
						onClick={() => onSelect(key)}
						aria-pressed={active}
						className={cn(
							'inline-flex h-8 shrink-0 cursor-pointer items-center rounded-[9px] border px-3.5 text-[12.5px] font-semibold transition-colors',
							active
								? 'border-primary bg-tone-indigo-bg text-tone-indigo-fg'
								: 'border-border bg-card text-foreground/70 hover:border-primary',
						)}
					>
						{label}
					</button>
				);
			})}
		</div>
	);
}
