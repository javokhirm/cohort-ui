import { useEffect } from 'react';

import { BranchSwitcher } from '@repo/ui';

import { useTeachBranches } from '@/api/branches';
import { useBranchStore } from '@/store/branchStore';
import { useAppT } from '@/locales';

/**
 * The teacher's branch switcher, in the topbar. TEACH wiring for `@repo/ui`'s
 * shared `<BranchSwitcher>` (MANAGE uses the same component in multi-select mode):
 * the branches the teacher teaches at, the persisted single selection, and the
 * reconcile-on-load that drops a branch they no longer teach at.
 *
 * Single-select, because the selection is a *place you are standing*, not a
 * filter you compose — and because the teach endpoints take no branch param, so
 * the filtering happens client-side over rows already fetched.
 *
 * Renders nothing for a single-branch teacher, which is most of them.
 */
export function BranchSelector() {
	const tShell = useAppT('shell');
	const { data: branches } = useTeachBranches();
	const activeBranchId = useBranchStore((s) => s.activeBranchId);
	const setActiveBranchId = useBranchStore((s) => s.setActiveBranchId);
	const reconcile = useBranchStore((s) => s.reconcile);

	useEffect(() => {
		if (branches) reconcile(branches.map((b) => b.id));
	}, [branches, reconcile]);

	if (!branches) return null;

	return (
		<BranchSwitcher
			mode="single"
			branches={branches}
			value={activeBranchId}
			onChange={setActiveBranchId}
			menuLabel={tShell('myBranches')}
		/>
	);
}
