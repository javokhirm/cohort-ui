import { GraduationCap, MapPin, Users, Wallet } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@repo/ui';

import type { TenantDetailView } from '@/api/tenants/types';
import { formatPrice } from '@repo/utils';
import { useAppT } from '@/locales';

export function OverviewTab({ tenant }: { tenant: TenantDetailView }) {
	const t = useAppT('tenants');
	const { stats } = tenant;
	return (
		<div className="flex flex-col gap-6">
			<div className="grid grid-cols-2 gap-4 md:grid-cols-4">
				<Card className="py-0">
					<CardContent className="px-5 py-4">
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<GraduationCap className="size-4" />
							<p className="text-xs">{t('overview.activeStudents')}</p>
						</div>
						<p className="mt-2 text-2xl font-bold tabular-nums">
							{stats.activeStudents ?? 0}
						</p>
						<p className="text-xs text-muted-foreground">
							{t('overview.enrolled')}
						</p>
					</CardContent>
				</Card>
				<Card className="py-0">
					<CardContent className="px-5 py-4">
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<Users className="size-4" />
							<p className="text-xs">{t('overview.activeStaff')}</p>
						</div>
						<p className="mt-2 text-2xl font-bold tabular-nums">
							{stats.activeStaff ?? 0}
						</p>
						<p className="text-xs text-muted-foreground">
							{t('overview.staffHint')}
						</p>
					</CardContent>
				</Card>
				<Card className="py-0">
					<CardContent className="px-5 py-4">
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<MapPin className="size-4" />
							<p className="text-xs">{t('overview.branches')}</p>
						</div>
						<p className="mt-2 text-2xl font-bold tabular-nums">
							{stats.branches}
						</p>
						<p className="text-xs text-muted-foreground">
							{t('overview.active')}
						</p>
					</CardContent>
				</Card>
				<Card className="py-0">
					<CardContent className="px-5 py-4">
						<div className="flex items-center gap-1.5 text-muted-foreground">
							<Wallet className="size-4" />
							<p className="text-xs">{t('overview.monthlyRevenue')}</p>
						</div>
						<p className="mt-2 text-2xl font-bold tabular-nums">
							{(stats.monthlyRevenue ?? 0) === 0
								? '—'
								: formatPrice(stats.monthlyRevenue!)}
						</p>
						<p className="text-xs text-muted-foreground">
							{stats.currency ?? tenant.defaultCurrency}
						</p>
					</CardContent>
				</Card>
			</div>

			<div className="grid grid-cols-1 gap-4 md:grid-cols-2">
				<Card className="gap-0 py-0">
					<CardHeader className="border-b border-border px-5 py-4">
						<CardTitle className="text-sm font-semibold">
							{t('overview.about')}
						</CardTitle>
					</CardHeader>
					<CardContent className="px-5 py-4">
						<dl className="flex flex-col gap-3 text-sm">
							{[
								{
									label: t('onboarding.city'),
									value: tenant.city ?? '—',
								},
								{
									label: t('overview.country'),
									value: t('overview.countryUzbekistan'),
								},
								{
									label: t('onboarding.timezone'),
									value: tenant.timezone,
								},
								{ label: t('onboarding.language'), value: tenant.locale },
								{
									label: t('onboarding.currency'),
									value: tenant.defaultCurrency,
								},
								...(tenant.phone
									? [
											{
												label: t('overview.phone'),
												value: tenant.phone,
											},
										]
									: []),
							].map(({ label, value }) => (
								<div key={label} className="flex justify-between gap-4">
									<dt className="text-muted-foreground">{label}</dt>
									<dd className="text-right font-medium">{value}</dd>
								</div>
							))}
						</dl>
					</CardContent>
				</Card>
			</div>
		</div>
	);
}
