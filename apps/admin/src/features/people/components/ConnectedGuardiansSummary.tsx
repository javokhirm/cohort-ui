import { Separator, StatusBadge } from '@repo/ui';

import { useAppT } from '@/locales';

import type { Guardian } from '../api/students.queries';

interface ConnectedGuardiansSummaryProps {
	guardians: Guardian[];
}

/**
 * The guardians already linked to the student being edited, shown above the
 * phone field so the operator can see who is covered before adding anybody.
 *
 * Read-only on purpose: unlinking and changing a link lives on the student's
 * Guardians tab, which has the confirm step those destructive edits need.
 */
export function ConnectedGuardiansSummary({ guardians }: ConnectedGuardiansSummaryProps) {
	const t = useAppT('people');

	if (guardians.length === 0) return null;

	return (
		<div className="rounded-lg border border-border bg-muted/40">
			{guardians.map((g, i) => (
				<div key={g.id}>
					{i > 0 && <Separator />}
					<div className="flex items-start justify-between gap-3 p-3">
						<div className="flex flex-col gap-0.5">
							<div className="flex items-center gap-2">
								<span className="text-sm font-medium">
									{g.user.firstName} {g.user.lastName}
								</span>
								<span className="text-xs text-muted-foreground">
									{t(`relation.${g.relation}`)}
								</span>
								{g.isPrimary && (
									<StatusBadge tone="indigo">
										{t('detail.guardians.primary')}
									</StatusBadge>
								)}
							</div>
							<span className="text-sm text-muted-foreground">
								{g.user.phone ?? '—'}
							</span>
						</div>
						<StatusBadge tone="green">
							{t('form.guardianLookup.alreadyConnected')}
						</StatusBadge>
					</div>
				</div>
			))}
		</div>
	);
}
