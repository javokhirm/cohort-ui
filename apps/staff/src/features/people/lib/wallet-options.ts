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
// The shared `lib/status.ts` table has no icon support, so tone/label/icon for
// wallet transactions are defined locally, the same way `group-options.ts`
// defines `GROUP_STATUS_META` for a kind the shared table doesn't cover.

export const WALLET_TRANSACTION_TYPE_META: Record<
	WalletTransactionType,
	{ label: string; tone: StatusTone; icon: LucideIcon }
> = {
	DEPOSIT: { label: 'Deposit', tone: 'green', icon: ArrowDownToLine },
	OVERPAYMENT: { label: 'Overpayment', tone: 'blue', icon: TrendingUp },
	REFUND_CREDIT: { label: 'Refund credit', tone: 'violet', icon: RotateCcw },
	INVOICE_APPLICATION: { label: 'Invoice payment', tone: 'slate', icon: FileText },
	ADJUSTMENT: { label: 'Adjustment', tone: 'amber', icon: SlidersHorizontal },
	CASHOUT: { label: 'Cash out', tone: 'red', icon: ArrowUpFromLine },
};

// ─── Deposit method ───────────────────────────────────────────────────────────

export const WALLET_DEPOSIT_METHOD_OPTIONS: {
	value: WalletDepositMethod;
	label: string;
}[] = [
	{ value: 'CASH', label: 'Cash' },
	{ value: 'CARD', label: 'Card' },
	{ value: 'BANK_TRANSFER', label: 'Bank transfer' },
];
