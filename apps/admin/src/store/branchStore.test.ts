import { beforeEach, describe, expect, it } from 'vitest';

import { useBranchStore } from './branchStore';

const STORAGE_KEY = 'cohort.staff.activeBranchIds';

describe('branchStore', () => {
	beforeEach(() => {
		localStorage.clear();
		useBranchStore.setState({ activeBranchIds: null });
	});

	describe('setActiveBranchIds', () => {
		it('stores a deduplicated selection and persists it', () => {
			useBranchStore.getState().setActiveBranchIds([2, 1, 2]);

			expect(useBranchStore.getState().activeBranchIds).toEqual([2, 1]);
			expect(JSON.parse(localStorage.getItem(STORAGE_KEY)!)).toEqual([2, 1]);
		});

		it('normalizes an empty selection to "all" and clears persistence', () => {
			useBranchStore.getState().setActiveBranchIds([1]);
			useBranchStore.getState().setActiveBranchIds([]);

			expect(useBranchStore.getState().activeBranchIds).toBeNull();
			expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
		});
	});

	describe('reconcile', () => {
		it('drops ids that are no longer accessible', () => {
			useBranchStore.getState().setActiveBranchIds([1, 2, 3]);
			useBranchStore.getState().reconcile([1, 3, 4]);
			expect(useBranchStore.getState().activeBranchIds).toEqual([1, 3]);
		});

		it('falls back to "all" when nothing selected survives', () => {
			useBranchStore.getState().setActiveBranchIds([9]);
			useBranchStore.getState().reconcile([1, 2]);
			expect(useBranchStore.getState().activeBranchIds).toBeNull();
		});

		it('leaves an "all" selection untouched', () => {
			useBranchStore.getState().reconcile([1, 2]);
			expect(useBranchStore.getState().activeBranchIds).toBeNull();
		});
	});
});
