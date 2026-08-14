import { Check, X } from 'lucide-react';

import { useAppT } from '@/locales';

/** `key_like_this` / `keyLikeThis` → "Key like this". */
function humanizeFeatureKey(key: string): string {
	const spaced = key
		.replace(/_/g, ' ')
		.replace(/([a-z0-9])([A-Z])/g, '$1 $2')
		.toLowerCase();
	return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

interface PlanFeaturesListProps {
	/** The plan's JSONB capability map, e.g. `{ referral_program: true }`. */
	features: Record<string, unknown>;
	maxStudents: number | null;
	maxBranches: number | null;
}

/**
 * Renders a plan's capability matrix. The keys are an open, backend-owned
 * vocabulary (docs/database-design.md — `subscriptionTiers.features`), so this
 * humanizes them rather than routing each one through the i18n catalog — there
 * is no fixed, translatable set to catalog against.
 */
export function PlanFeaturesList({
	features,
	maxStudents,
	maxBranches,
}: PlanFeaturesListProps) {
	const t = useAppT('subscription');
	const entries = Object.entries(features);

	return (
		<ul className="flex flex-col gap-2 text-sm">
			<FeatureRow
				label={t('features.maxStudents')}
				value={
					maxStudents == null ? t('features.unlimited') : String(maxStudents)
				}
			/>
			<FeatureRow
				label={t('features.maxBranches')}
				value={
					maxBranches == null ? t('features.unlimited') : String(maxBranches)
				}
			/>
			{entries.length === 0 ? (
				<li className="text-muted-foreground">{t('features.empty')}</li>
			) : (
				entries.map(([key, value]) => (
					<li key={key} className="flex items-center gap-2">
						{typeof value === 'boolean' ? (
							value ? (
								<Check className="size-4 shrink-0 text-tone-green-fg" />
							) : (
								<X className="size-4 shrink-0 text-muted-foreground" />
							)
						) : (
							<Check className="size-4 shrink-0 text-tone-green-fg" />
						)}
						<span
							className={
								value === false
									? 'text-muted-foreground line-through'
									: ''
							}
						>
							{humanizeFeatureKey(key)}
							{typeof value !== 'boolean' && `: ${String(value)}`}
						</span>
					</li>
				))
			)}
		</ul>
	);
}

function FeatureRow({ label, value }: { label: string; value: string }) {
	return (
		<li className="flex items-center justify-between gap-2 border-b border-border pb-2 last:border-0 last:pb-0">
			<span className="text-muted-foreground">{label}</span>
			<span className="font-semibold tabular-nums">{value}</span>
		</li>
	);
}
