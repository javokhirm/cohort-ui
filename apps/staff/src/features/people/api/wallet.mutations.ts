import { useMutation, useQueryClient } from '@tanstack/react-query';

import { manageApi } from '@/api/apiClient';

import { peopleKeys } from './keys';
import type { Wallet } from './wallet.queries';

// ─── Input types ─────────────────────────────────────────────────────────────
// Mirror the backend `DepositDto` / `AdjustWalletDto` (api-reference.md §3.13c).

export const WALLET_DEPOSIT_METHODS = ['CASH', 'CARD', 'BANK_TRANSFER'] as const;
export type WalletDepositMethod = (typeof WALLET_DEPOSIT_METHODS)[number];

export interface DepositInput {
	studentId: number;
	amount: number;
	method: WalletDepositMethod;
	notes?: string | null;
}

export interface AdjustBalanceInput {
	studentId: number;
	/** Signed, non-zero. Negative is rejected server-side if it would drive the balance below zero. */
	amount: number;
	reason: string;
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useDepositToWallet() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ studentId, ...body }: DepositInput) =>
			manageApi.post<Wallet>(`/students/${studentId}/wallet/deposits`, body),
		onSuccess: (_data, variables) => {
			void qc.invalidateQueries({
				queryKey: peopleKeys.studentWallet(variables.studentId),
			});
		},
	});
}

export function useAdjustWalletBalance() {
	const qc = useQueryClient();
	return useMutation({
		mutationFn: ({ studentId, ...body }: AdjustBalanceInput) =>
			manageApi.post<Wallet>(`/students/${studentId}/wallet/adjustments`, body),
		onSuccess: (_data, variables) => {
			void qc.invalidateQueries({
				queryKey: peopleKeys.studentWallet(variables.studentId),
			});
		},
	});
}
