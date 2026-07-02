import { useEffect } from 'react';
import { Check, ChevronDown, Building2 } from 'lucide-react';

import {
	DropdownMenu,
	DropdownMenuCheckboxItem,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@repo/ui';

import { useBranches } from '@/api/branches';
import { useBranchStore } from '@/store/branchStore';

/**
 * Global multi-select branch selector (docs/auth-and-rbac.md §6). Lists the
 * branches the backend says this user can access, keeps the persisted selection
 * honest (reconciles on load), and hides itself for single-branch users. Every
 * list query derives its `branchIds` filter from the selection via
 * `useActiveBranchIds`, so switching here refetches the whole app.
 */
export function BranchSelector() {
	const { data: branches } = useBranches();
	const activeBranchIds = useBranchStore((s) => s.activeBranchIds);
	const toggleBranch = useBranchStore((s) => s.toggleBranch);
	const setActiveBranchIds = useBranchStore((s) => s.setActiveBranchIds);
	const reconcile = useBranchStore((s) => s.reconcile);

	useEffect(() => {
		if (branches) reconcile(branches.map((b) => b.id));
	}, [branches, reconcile]);

	// Loading/error or a single accessible branch: nothing to select.
	if (!branches || branches.length <= 1) return null;

	const label =
		activeBranchIds === null
			? 'All branches'
			: activeBranchIds.length === 1
				? (branches.find((b) => b.id === activeBranchIds[0])?.name ?? '1 branch')
				: `${activeBranchIds.length} branches`;

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<button
					type="button"
					className="flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-sm hover:bg-muted"
				>
					<Building2 className="size-3.5 text-muted-foreground" />
					<span className="font-medium text-foreground">{label}</span>
					<ChevronDown className="size-3.5 text-muted-foreground" />
				</button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="start" className="w-56">
				<DropdownMenuLabel className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
					Branches
				</DropdownMenuLabel>
				<DropdownMenuItem
					onSelect={(e) => {
						e.preventDefault();
						setActiveBranchIds(null);
					}}
					className="gap-2"
				>
					<span className="flex-1">All branches</span>
					{activeBranchIds === null && <Check className="size-3.5 text-primary" />}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				{branches.map((branch) => (
					<DropdownMenuCheckboxItem
						key={branch.id}
						checked={activeBranchIds?.includes(branch.id) ?? false}
						onSelect={(e) => e.preventDefault()}
						onCheckedChange={() => toggleBranch(branch.id)}
					>
						{branch.name}
					</DropdownMenuCheckboxItem>
				))}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
