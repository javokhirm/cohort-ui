import {
	ArrowDownToLine,
	ArrowUpFromLine,
	FileText,
	RotateCcw,
	SlidersHorizontal,
	TrendingUp,
	type LucideIcon,
} from 'lucide-react';

import type { StatusTone } from '@repo/ui';

import type { WalletTransactionType } from '../api/wallet.queries';
import type { WalletDepositMethod } from '../api/wallet.mutations';

// ─── Wallet transaction type ─────────────────────────────────────────────────
// The shared `lib/status.ts` table has no icon support, so tone + icon for wallet
// transactions are defined locally, the same way `group-options.ts` defines
// `GROUP_STATUS_META` for a kind the shared table doesn't cover. Labels are NOT
// here — they live in the app catalog under `people.wallet.txType.*` and are
// resolved at render, so a language switch re-translates them (conventions.md §7).

export const WALLET_TRANSACTION_TYPE_META: Record<
	WalletTransactionType,
	{ tone: StatusTone; icon: LucideIcon }
> = {
	DEPOSIT: { tone: 'green', icon: ArrowDownToLine },
	OVERPAYMENT: { tone: 'blue', icon: TrendingUp },
	REFUND_CREDIT: { tone: 'violet', icon: RotateCcw },
	INVOICE_APPLICATION: { tone: 'slate', icon: FileText },
	ADJUSTMENT: { tone: 'amber', icon: SlidersHorizontal },
	CASHOUT: { tone: 'red', icon: ArrowUpFromLine },
};

// ─── Deposit method ───────────────────────────────────────────────────────────

/** Values only — labels come from `people.wallet.method.*` at render. */
export const WALLET_DEPOSIT_METHOD_OPTIONS: { value: WalletDepositMethod }[] = [
	{ value: 'CASH' },
	{ value: 'CARD' },
	{ value: 'BANK_TRANSFER' },
];
