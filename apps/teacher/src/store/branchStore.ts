import { create } from 'zustand';

/**
 * The teacher's active branch. `null` means "all branches" — no filter.
 *
 * Single-select, unlike MANAGE's multi-select store, and **client-side**: no
 * `/teach/*` endpoint accepts a branch param (api-reference §4), so the backend
 * cannot narrow for us. The teach surface is already scoped by ownership — a
 * teacher only ever receives the groups they teach — so this is a view filter
 * over rows the client already holds, not an authorization boundary. That is why
 * the selection is deliberately absent from the query keys: switching branch must
 * not refetch.
 *
 * Persisted like the refresh token (hand-rolled, app-scoped key) so the choice
 * survives a reload, and reconciled against the fetched branches on boot.
 */
const ACTIVE_BRANCH_KEY = 'cohort.teacher.activeBranchId';

function readStoredSelection(): number | null {
	try {
		const raw = localStorage.getItem(ACTIVE_BRANCH_KEY);
		if (!raw) return null;
		const parsed: unknown = JSON.parse(raw);
		return typeof parsed === 'number' && Number.isInteger(parsed) ? parsed : null;
	} catch {
		return null;
	}
}

function writeStoredSelection(id: number | null): void {
	try {
		if (id === null) {
			localStorage.removeItem(ACTIVE_BRANCH_KEY);
		} else {
			localStorage.setItem(ACTIVE_BRANCH_KEY, JSON.stringify(id));
		}
	} catch {
		/* storage unavailable (private mode) — the choice just won't survive a reload */
	}
}

interface BranchState {
	/** The selected branch id; `null` = all branches. */
	activeBranchId: number | null;
	setActiveBranchId: (id: number | null) => void;
	/**
	 * Drop the selection if that branch is no longer one the teacher teaches at
	 * (their last group there ended, or it was reassigned). Called when the
	 * branches load; falls back to "all".
	 */
	reconcile: (accessibleIds: number[]) => void;
}

export const useBranchStore = create<BranchState>((set, get) => ({
	activeBranchId: readStoredSelection(),
	setActiveBranchId: (id) => {
		writeStoredSelection(id);
		set({ activeBranchId: id });
	},
	reconcile: (accessibleIds) => {
		const current = get().activeBranchId;
		if (current === null) return;
		if (!accessibleIds.includes(current)) {
			get().setActiveBranchId(null);
		}
	},
}));

/**
 * Keep only the rows belonging to the active branch. `null` (all) passes
 * everything through. Every teach row — session, group — carries a `branchId`,
 * which is what makes a purely client-side filter possible.
 */
export function useBranchFilter(): <T extends { branchId: number }>(rows: T[]) => T[] {
	const activeBranchId = useBranchStore((s) => s.activeBranchId);
	return (rows) =>
		activeBranchId === null
			? rows
			: rows.filter((row) => row.branchId === activeBranchId);
}
