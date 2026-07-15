import * as React from 'react';
import { Check, ChevronDown } from 'lucide-react';
import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@repo/ui/components/dropdown-menu';
import { cn } from '@repo/ui/lib/utils';

/**
 * The five theme dot colors branches cycle through. Tokens, not hex, so the dots
 * follow light/dark like every other colored surface.
 */
const BRANCH_DOT_CLASSES = [
	'bg-chart-1',
	'bg-chart-2',
	'bg-chart-3',
	'bg-chart-4',
	'bg-chart-5',
] as const;

/**
 * The dot color for a branch. Keyed on the branch id (not its position in the
 * list) so a branch keeps the same color as the list is filtered or reordered,
 * and the same color everywhere it is shown — the switcher, a group card, a
 * detail row.
 */
export function branchDotClass(branchId: number): string {
	const index = Math.abs(branchId) % BRANCH_DOT_CLASSES.length;
	return BRANCH_DOT_CLASSES[index] as string;
}

export interface BranchSwitcherOption {
	id: number;
	name: string;
}

interface BranchSwitcherBaseProps {
	/** The branches the user can reach. The switcher hides itself below two. */
	branches: BranchSwitcherOption[];
	/** The "no branch filter" option, and the trigger label while it is active. */
	allLabel?: string;
	/** Uppercase section heading above the branch list. */
	menuLabel?: string;
	/**
	 * Leading trigger content. Defaults to the active branch's colored dot (and
	 * the `allLabel` dot when nothing specific is selected).
	 */
	icon?: React.ReactNode;
	/** Colored dot beside each option and in the trigger. */
	dots?: boolean;
	/** Trigger label when several branches are selected (multi mode only). */
	summaryLabel?: (count: number) => string;
	align?: 'start' | 'center' | 'end';
	className?: string;
}

interface BranchSwitcherSingleProps extends BranchSwitcherBaseProps {
	mode: 'single';
	/** The selected branch, or `null` for "all". */
	value: number | null;
	onChange: (next: number | null) => void;
}

interface BranchSwitcherMultiProps extends BranchSwitcherBaseProps {
	mode: 'multi';
	/** The selected branches, or `null` for "all". Never `[]`. */
	value: number[] | null;
	onChange: (next: number[] | null) => void;
}

export type BranchSwitcherProps = BranchSwitcherSingleProps | BranchSwitcherMultiProps;

/**
 * The global branch/location switcher, shared by every app that scopes its views
 * to a branch (docs/auth-and-rbac.md §6).
 *
 * Purely presentational and fully controlled: it renders the branches it is given
 * and reports the next selection. It owns no store, fetches nothing, and knows
 * nothing about how a selection is persisted or turned into a query — those
 * differ per surface and stay in the app. MANAGE selects `multi` (the selection
 * becomes the `branchIds` filter the backend narrows by); TEACH selects `single`
 * (the teach endpoints take no branch param, so the app filters the rows it
 * already holds).
 *
 * `null` means "all branches" in both modes — the switcher never emits an empty
 * selection, so a consumer never has to distinguish `[]` from "no filter".
 *
 * Renders nothing when the user can reach fewer than two branches: with one
 * branch there is nothing to switch between, and the chip would be dead chrome.
 */
export function BranchSwitcher(props: BranchSwitcherProps) {
	const {
		branches,
		allLabel = 'All branches',
		menuLabel = 'Branches',
		icon,
		dots = true,
		summaryLabel = (count: number) => `${count} branches`,
		align = 'start',
		className,
	} = props;

	if (branches.length < 2) return null;

	const nameOf = (id: number) => branches.find((b) => b.id === id)?.name;

	const selectedIds: number[] =
		props.mode === 'single'
			? props.value === null
				? []
				: [props.value]
			: (props.value ?? []);

	const isActive = (id: number) => selectedIds.includes(id);

	const triggerLabel =
		selectedIds.length === 0
			? allLabel
			: selectedIds.length === 1
				? (nameOf(selectedIds[0] as number) ?? allLabel)
				: summaryLabel(selectedIds.length);

	/** The dot shown in the trigger: the selected branch's, or the primary tint for "all". */
	const triggerDot =
		selectedIds.length === 1
			? branchDotClass(selectedIds[0] as number)
			: 'bg-primary';

	/** Multi mode: add/remove one branch, collapsing an emptied selection to "all". */
	const toggle = (id: number) => {
		if (props.mode !== 'multi') return;
		const current = props.value;
		const next =
			current === null
				? [id]
				: current.includes(id)
					? current.filter((b) => b !== id)
					: [...current, id];
		props.onChange(next.length > 0 ? next : null);
	};

	// Both arms pass `null`; the branch only exists so TypeScript narrows the
	// union's `onChange` to one signature before the call.
	const selectAll = () => {
		if (props.mode === 'single') props.onChange(null);
		else props.onChange(null);
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className={cn(
						'flex h-8 shrink-0 items-center gap-[7px] rounded-lg border border-border bg-card px-2.5 transition-colors hover:bg-muted',
						className,
					)}
				>
					{icon ??
						(dots && (
							<span
								className={cn(
									'size-[7px] shrink-0 rounded-full',
									triggerDot,
								)}
							/>
						))}
					<span className="text-[12.5px] font-semibold text-foreground">
						{triggerLabel}
					</span>
					<ChevronDown className="size-3.5 shrink-0 text-muted-foreground" />
				</button>
			</DropdownMenuTrigger>

			<DropdownMenuContent align={align} className="w-56">
				<DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
					{menuLabel}
				</DropdownMenuLabel>

				<DropdownMenuItem
					onSelect={(e) => {
						// Multi mode keeps the menu open so several branches can be
						// toggled in one pass; single mode closes on pick, as a radio
						// group should.
						if (props.mode === 'multi') e.preventDefault();
						selectAll();
					}}
					className="gap-2"
				>
					{dots && (
						<span className="size-[7px] shrink-0 rounded-full bg-primary" />
					)}
					<span className="flex-1">{allLabel}</span>
					{selectedIds.length === 0 && (
						<Check className="size-3.5 text-primary" />
					)}
				</DropdownMenuItem>

				<DropdownMenuSeparator />

				{branches.map((branch) =>
					props.mode === 'multi' ? (
						<DropdownMenuCheckboxItem
							key={branch.id}
							checked={isActive(branch.id)}
							onSelect={(e) => e.preventDefault()}
							onCheckedChange={() => toggle(branch.id)}
						>
							<span className="flex items-center gap-2">
								{dots && (
									<span
										className={cn(
											'size-[7px] shrink-0 rounded-full',
											branchDotClass(branch.id),
										)}
									/>
								)}
								{branch.name}
							</span>
						</DropdownMenuCheckboxItem>
					) : (
						<DropdownMenuItem
							key={branch.id}
							onSelect={() => props.onChange(branch.id)}
							className="gap-2"
						>
							{dots && (
								<span
									className={cn(
										'size-[7px] shrink-0 rounded-full',
										branchDotClass(branch.id),
									)}
								/>
							)}
							<span
								className={cn(
									'flex-1',
									isActive(branch.id) && 'font-semibold',
								)}
							>
								{branch.name}
							</span>
							{isActive(branch.id) && (
								<Check className="size-3.5 text-primary" />
							)}
						</DropdownMenuItem>
					),
				)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
