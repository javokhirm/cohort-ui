import { useEffect } from 'react';
import { Building2 } from 'lucide-react';

import { BranchSwitcher } from '@repo/ui';

import { useBranches } from '@/api/branches';
import { useBranchStore } from '@/store/branchStore';

/**
 * Global multi-select branch selector (docs/auth-and-rbac.md §6). Lists the
 * branches the backend says this user can access, keeps the persisted selection
 * honest (reconciles on load), and hides itself for single-branch users. Every
 * list query derives its `branchIds` filter from the selection via
 * `useActiveBranchIds`, so switching here refetches the whole app.
 *
 * The chip and menu are `@repo/ui`'s shared `<BranchSwitcher>` (TEACH uses the
 * same one, in single-select mode). What stays here is the MANAGE wiring: the
 * accessible branches, the persisted selection, and the multi-select mode the
 * `branchIds` filter is built on.
 */
export function BranchSelector() {
	const { data: branches } = useBranches();
	const activeBranchIds = useBranchStore((s) => s.activeBranchIds);
	const setActiveBranchIds = useBranchStore((s) => s.setActiveBranchIds);
	const reconcile = useBranchStore((s) => s.reconcile);

	useEffect(() => {
		if (branches) reconcile(branches.map((b) => b.id));
	}, [branches, reconcile]);

	// Loading/error: nothing to select yet. (The switcher itself hides when the
	// user can reach fewer than two branches.)
	if (!branches) return null;

	return (
		<BranchSwitcher
			mode="multi"
			branches={branches}
			value={activeBranchIds}
			onChange={setActiveBranchIds}
			icon={<Building2 className="size-3.5 shrink-0 text-muted-foreground" />}
			dots={false}
		/>
	);
}
