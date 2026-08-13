import { cn } from '@repo/ui';

import type { StudentGroup } from '@/features/progress/api/groups.queries';

interface GroupSelectChipsProps {
	groups: StudentGroup[];
	selected: number | undefined;
	onSelect: (groupId: number) => void;
}

/**
 * The group switch. Deliberately **not** `progress`'s `GroupFilterChips`, which
 * offers an "All groups" state: a leaderboard is always scoped to exactly one
 * group, because cohorts and grading scales differ and pooling them would rank
 * a student against classmates they have never shared a class with.
 *
 * Renders nothing for a single group — a switch with one option is noise.
 *
 * The chip itself is Progress's, down to the radius and the active tint: it is
 * the same control doing the same job two screens apart, and a student should
 * not have to learn it twice. Only the option set differs.
 */
export function GroupSelectChips({ groups, selected, onSelect }: GroupSelectChipsProps) {
	if (groups.length < 2) return null;

	return (
		<div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-1">
			{groups.map((group) => {
				const active = selected === group.id;
				return (
					<button
						key={group.id}
						type="button"
						onClick={() => onSelect(group.id)}
						aria-pressed={active}
						className={cn(
							'inline-flex h-8 shrink-0 cursor-pointer items-center rounded-[9px] border px-3.5 text-[12.5px] font-semibold transition-colors',
							active
								? 'border-primary bg-tone-indigo-bg text-tone-indigo-fg'
								: 'border-border bg-card text-foreground/70 hover:border-primary',
						)}
					>
						{group.name}
					</button>
				);
			})}
		</div>
	);
}
