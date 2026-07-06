import { useState } from 'react';
import { ArrowDownToLine, SlidersHorizontal, Wallet as WalletIcon } from 'lucide-react';

import {
	Button,
	Card,
	cn,
	EmptyState,
	Skeleton,
	StatCard,
	StatusBadge,
	TONE_CLASSES,
} from '@repo/ui';
import { formatDateTime, formatPrice } from '@repo/utils';

import { Can } from '@/components/Can';
import { useStudentWallet } from '../api/wallet.queries';
import { WALLET_TRANSACTION_TYPE_META } from '../lib/wallet-options';
import { WalletDepositDialog } from './WalletDepositDialog';
import { WalletAdjustBalanceDialog } from './WalletAdjustBalanceDialog';

interface WalletSectionProps {
	studentId: number;
}

export function WalletSection({ studentId }: WalletSectionProps) {
	const { data: wallet, isLoading } = useStudentWallet(studentId);
	const [depositOpen, setDepositOpen] = useState(false);
	const [adjustOpen, setAdjustOpen] = useState(false);

	if (isLoading || !wallet) {
		return (
			<div className="flex flex-col gap-4">
				<Skeleton className="h-24 rounded-xl" />
				<Skeleton className="h-64 rounded-xl" />
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-4">
			<div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
				<StatCard
					label="Wallet balance"
					value={`${formatPrice(wallet.balance)} ${wallet.currency}`}
					icon={<WalletIcon />}
					className="sm:max-w-xs"
				/>
				<div className="flex items-center gap-2">
					<Can permission="wallet.deposit">
						<Button variant="outline" onClick={() => setDepositOpen(true)}>
							<ArrowDownToLine className="mr-1.5 size-4" />
							Deposit
						</Button>
					</Can>
					<Can permission="wallet.adjust">
						<Button variant="outline" onClick={() => setAdjustOpen(true)}>
							<SlidersHorizontal className="mr-1.5 size-4" />
							Adjust balance
						</Button>
					</Can>
				</div>
			</div>

			<Card className="gap-0 overflow-hidden py-0">
				<div className="border-b border-border px-5 py-3">
					<h2 className="text-sm font-semibold">Recent transactions</h2>
				</div>
				{wallet.transactions.length === 0 ? (
					<EmptyState
						icon={<WalletIcon />}
						title="No transactions yet"
						description="Deposits, adjustments, and invoice activity will show up here."
					/>
				) : (
					<div className="max-h-96 divide-y divide-border overflow-y-auto">
						{wallet.transactions.map((t) => {
							const meta = WALLET_TRANSACTION_TYPE_META[t.type];
							const Icon = meta.icon;
							return (
								<div
									key={t.id}
									className="flex items-center justify-between gap-3 px-5 py-3"
								>
									<div className="flex items-center gap-3">
										<span
											className={cn(
												'flex size-8 shrink-0 items-center justify-center rounded-lg [&>svg]:size-4',
												TONE_CLASSES[meta.tone],
											)}
										>
											<Icon />
										</span>
										<div>
											<StatusBadge tone={meta.tone}>
												{meta.label}
											</StatusBadge>
											<div className="mt-1 text-xs text-muted-foreground">
												{formatDateTime(t.createdAt)}
												{t.notes ? ` · ${t.notes}` : ''}
											</div>
										</div>
									</div>
									<div
										className={cn(
											'shrink-0 text-sm font-bold tabular-nums',
											t.amount >= 0
												? 'text-tone-green-fg'
												: 'text-tone-red-fg',
										)}
									>
										{t.amount > 0 ? '+' : ''}
										{formatPrice(t.amount)} UZS
									</div>
								</div>
							);
						})}
					</div>
				)}
			</Card>

			<WalletDepositDialog
				studentId={studentId}
				open={depositOpen}
				onOpenChange={setDepositOpen}
			/>
			<WalletAdjustBalanceDialog
				studentId={studentId}
				currentBalance={wallet.balance}
				open={adjustOpen}
				onOpenChange={setAdjustOpen}
			/>
		</div>
	);
}
