import { ArrowDownToLine, Calculator, CreditCard, RefreshCw, Wallet } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

import { Card, cn, Separator, StatusBadge } from '@repo/ui';
import type { StatusTone } from '@repo/ui';
import { formatDateTime, formatMoney } from '@repo/utils';

import type { StudentWallet } from '../api/billing.queries';
import { useAppT } from '@/locales';

type WalletTxType = StudentWallet['transactions'][number]['type'];

const TX_META: Record<WalletTxType, { tone: StatusTone; Icon: LucideIcon }> = {
	DEPOSIT: { tone: 'green', Icon: ArrowDownToLine },
	OVERPAYMENT: { tone: 'green', Icon: Wallet },
	REFUND_CREDIT: { tone: 'violet', Icon: RefreshCw },
	INVOICE_APPLICATION: { tone: 'blue', Icon: CreditCard },
	ADJUSTMENT: { tone: 'amber', Icon: Calculator },
	CASHOUT: { tone: 'slate', Icon: Wallet },
};

const TX_ICON_CLASS: Record<StatusTone, string> = {
	green: 'bg-tone-green-bg text-tone-green-fg',
	red: 'bg-tone-red-bg text-tone-red-fg',
	amber: 'bg-tone-amber-bg text-tone-amber-fg',
	blue: 'bg-tone-blue-bg text-tone-blue-fg',
	violet: 'bg-tone-violet-bg text-tone-violet-fg',
	slate: 'bg-tone-slate-bg text-tone-slate-fg',
	indigo: 'bg-tone-indigo-bg text-tone-indigo-fg',
	cyan: 'bg-tone-cyan-bg text-tone-cyan-fg',
	pink: 'bg-tone-pink-bg text-tone-pink-fg',
	orange: 'bg-tone-orange-bg text-tone-orange-fg',
	yellow: 'bg-tone-yellow-bg text-tone-yellow-fg',
};

interface WalletTransactionListProps {
	wallet: StudentWallet;
}

/**
 * The Wallet view per the design: recent ledger movements — a tinted type chip, the
 * date + front-desk note, and the signed amount — with the "applied automatically"
 * caption underneath.
 */
export function WalletTransactionList({ wallet }: WalletTransactionListProps) {
	const t = useAppT('billing');

	return (
		<div>
			<h2 className="mb-2 px-0.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
				{t('recentTransactions')}
			</h2>
			<Card className="gap-0 overflow-hidden py-0">
				{wallet.transactions.length === 0 ? (
					<p className="px-4 py-8 text-center text-sm text-muted-foreground">
						{t('noTransactions')}
					</p>
				) : (
					wallet.transactions.map((tx, i) => {
						const meta = TX_META[tx.type];
						const isDebit = tx.amount < 0;
						return (
							<div key={tx.id}>
								{i > 0 && <Separator />}
								<div className="flex items-center gap-3 p-3.5">
									<span
										className={cn(
											'flex size-9.5 shrink-0 items-center justify-center rounded-[11px] [&>svg]:size-4',
											TX_ICON_CLASS[meta.tone],
										)}
									>
										<meta.Icon />
									</span>
									<div className="min-w-0 flex-1">
										<StatusBadge tone={meta.tone}>
											{t(`walletTx.${tx.type}`)}
										</StatusBadge>
										<p className="mt-1 truncate text-[11.5px] text-muted-foreground">
											{formatDateTime(tx.createdAt)}
											{tx.notes ? ` · ${tx.notes}` : ''}
										</p>
									</div>
									<span
										className={cn(
											'shrink-0 text-sm font-bold tabular-nums',
											isDebit
												? 'text-tone-red-fg'
												: 'text-tone-green-fg',
										)}
									>
										{isDebit ? '−' : '+'}
										{formatMoney(Math.abs(tx.amount), wallet.currency)}
									</span>
								</div>
							</div>
						);
					})
				)}
			</Card>
			<p className="mt-3 text-center text-[11.5px] leading-relaxed text-muted-foreground">
				{t('walletCaption')}
			</p>
		</div>
	);
}
