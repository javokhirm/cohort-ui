import { Ban, PauseCircle, PlayCircle } from 'lucide-react';

import { Button } from '@repo/ui';

import type { TenantStatus } from '@/api/tenants/types';
import { useAppT } from '@/locales';

export function DangerZoneTab({
	status,
	onSuspend,
	onUnsuspend,
	onCancel,
}: {
	status: TenantStatus;
	onSuspend: () => void;
	onUnsuspend: () => void;
	onCancel: () => void;
}) {
	const t = useAppT('tenants');
	return (
		<div className="flex max-w-lg flex-col gap-4">
			{status === 'SUSPENDED' ? (
				<div className="flex items-start justify-between gap-4 rounded-lg border border-green-500/40 bg-green-500/5 px-5 py-4">
					<div className="flex-1">
						<p className="flex items-center gap-1.5 text-sm font-semibold text-green-600 dark:text-green-400">
							<PlayCircle className="size-4" />
							{t('danger.unsuspend')}
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							Restores access for all staff, teachers, students and parents.
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="shrink-0 border-green-500 text-green-600 hover:bg-green-500/10 dark:text-green-400"
						onClick={onUnsuspend}
					>
						{t('danger.unsuspend')}
					</Button>
				</div>
			) : (
				<div className="flex items-start justify-between gap-4 rounded-lg border border-amber-500/40 bg-amber-500/5 px-5 py-4">
					<div className="flex-1">
						<p className="flex items-center gap-1.5 text-sm font-semibold text-amber-600 dark:text-amber-400">
							<PauseCircle className="size-4" />
							{t('danger.suspend')}
						</p>
						<p className="mt-1 text-xs text-muted-foreground">
							Immediately locks out all staff, teachers, students and
							parents. Data is retained. This is reversible — you can
							reactivate at any time.
						</p>
					</div>
					<Button
						variant="outline"
						size="sm"
						className="shrink-0 border-amber-500 text-amber-600 hover:bg-amber-500/10 dark:text-amber-400"
						onClick={onSuspend}
					>
						{t('danger.suspend')}
					</Button>
				</div>
			)}

			<div className="flex items-start justify-between gap-4 rounded-lg border border-destructive/40 bg-destructive/5 px-5 py-4">
				<div className="flex-1">
					<p className="flex items-center gap-1.5 text-sm font-semibold text-destructive">
						<Ban className="size-4" />
						{t('danger.cancelSubscription')}
					</p>
					<p className="mt-1 text-xs text-muted-foreground">
						{t('danger.terminates')}
						after 30 days. This is <strong>permanent</strong> and cannot be
						undone from the console.
					</p>
				</div>
				<Button
					variant="destructive"
					size="sm"
					className="shrink-0"
					onClick={onCancel}
				>
					{t('danger.cancelSubscription')}
				</Button>
			</div>
		</div>
	);
}
