import { create } from 'zustand';

/**
 * Global branch selection (docs/auth-and-rbac.md §6). `null` means "all
 * accessible branches" — list queries then send no `branchIds` param and the
 * backend auto-narrows to the user's branch scope. A concrete array is injected
 * into list query filters as `branchIds`, so it is part of every query key and
 * changing the selection refetches.
 *
 * Persisted per app (like the refresh token) so the selection survives reloads;
 * it is reconciled against the freshly fetched branches on boot.
 */
const ACTIVE_BRANCHES_KEY = 'cohort.staff.activeBranchIds';

function readStoredSelection(): number[] | null {
	try {
		const raw = localStorage.getItem(ACTIVE_BRANCHES_KEY);
		if (!raw) return null;
		const parsed: unknown = JSON.parse(raw);
		if (
			Array.isArray(parsed) &&
			parsed.length > 0 &&
			parsed.every((id) => typeof id === 'number' && Number.isInteger(id))
		) {
			return parsed;
		}
		return null;
	} catch {
		return null;
	}
}

function writeStoredSelection(ids: number[] | null): void {
	try {
		if (ids === null) {
			localStorage.removeItem(ACTIVE_BRANCHES_KEY);
		} else {
			localStorage.setItem(ACTIVE_BRANCHES_KEY, JSON.stringify(ids));
		}
	} catch {
		/* storage unavailable (private mode) — selection won't persist across reloads */
	}
}

interface BranchState {
	/** Selected branch ids; `null` = all accessible branches. Never `[]`. */
	activeBranchIds: number[] | null;
	setActiveBranchIds: (ids: number[] | null) => void;
	/** Add/remove one branch. Deselecting the last selected branch falls back to "all". */
	toggleBranch: (id: number) => void;
	/**
	 * Drop selected ids that are no longer accessible (branch removed, role
	 * revoked). Called when the accessible branches load; an emptied selection
	 * falls back to "all".
	 */
	reconcile: (accessibleIds: number[]) => void;
}

export const useBranchStore = create<BranchState>((set, get) => ({
	activeBranchIds: readStoredSelection(),
	setActiveBranchIds: (ids) => {
		const next = ids && ids.length > 0 ? [...new Set(ids)] : null;
		writeStoredSelection(next);
		set({ activeBranchIds: next });
	},
	toggleBranch: (id) => {
		const current = get().activeBranchIds;
		const next =
			current === null
				? [id]
				: current.includes(id)
					? current.filter((b) => b !== id)
					: [...current, id];
		get().setActiveBranchIds(next);
	},
	reconcile: (accessibleIds) => {
		const current = get().activeBranchIds;
		if (current === null) return;
		const kept = current.filter((id) => accessibleIds.includes(id));
		if (kept.length !== current.length) {
			get().setActiveBranchIds(kept);
		}
	},
}));

/**
 * The `branchIds` value for list query filters: the selected branches, or
 * `undefined` when "all" is active (the param is omitted and the backend
 * narrows to the user's scope).
 */
export function useActiveBranchIds(): number[] | undefined {
	return useBranchStore((s) => s.activeBranchIds ?? undefined);
}
