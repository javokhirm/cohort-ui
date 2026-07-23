import { Button, Card, CardContent, Input, Label } from '@repo/ui';

import type { OnboardFormData } from './types';
import { useAppT } from '@/locales';

export function BusinessStep({
	data,
	onChange,
	onNext,
}: {
	data: OnboardFormData;
	onChange: (patch: Partial<OnboardFormData>) => void;
	onNext: () => void;
}) {
	const t = useAppT('tenants');
	return (
		<Card>
			<CardContent className="flex flex-col gap-6 pt-6">
				<div>
					<p className="text-base font-semibold">Business information</p>
					<p className="text-sm text-muted-foreground">
						Tell us about the education center.
					</p>
				</div>

				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="center-name">Center name</Label>
						<Input
							id="center-name"
							value={data.centerName}
							onChange={(e) => onChange({ centerName: e.target.value })}
							placeholder={t('onboarding.businessNamePlaceholder')}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="city">City</Label>
						<Input
							id="city"
							value={data.city}
							onChange={(e) => onChange({ city: e.target.value })}
							placeholder={t('onboarding.branchCityPlaceholder')}
						/>
					</div>
				</div>

				<div className="flex justify-end">
					<Button onClick={onNext} disabled={!data.centerName.trim()}>
						{t('onboarding.continue')}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
