import { Button, Card, CardContent, Input, Label } from '@repo/ui';

import type { OnboardFormData } from './types';
import { useAppT } from '@/locales';

export function BranchStep({
	data,
	onChange,
	onBack,
	onNext,
}: {
	data: OnboardFormData;
	onChange: (patch: Partial<OnboardFormData>) => void;
	onBack: () => void;
	onNext: () => void;
}) {
	const t = useAppT('tenants');
	return (
		<Card>
			<CardContent className="flex flex-col gap-6 pt-6">
				<div>
					<p className="text-base font-semibold">
						{t('onboarding.initialBranch')}
					</p>
					<p className="text-sm text-muted-foreground">
						{t('onboarding.branchSubtitle')}
					</p>
				</div>

				<div className="flex flex-col gap-4">
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="branch-name">{t('onboarding.branchName')}</Label>
						<Input
							id="branch-name"
							value={data.branchName}
							onChange={(e) => onChange({ branchName: e.target.value })}
							placeholder={t('onboarding.branchNamePlaceholder')}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="branch-code">{t('onboarding.branchCode')}</Label>
						<Input
							id="branch-code"
							value={data.branchCode}
							onChange={(e) =>
								onChange({
									branchCode: e.target.value
										.toUpperCase()
										.replace(/[^A-Z0-9-]/g, ''),
								})
							}
							placeholder={t('onboarding.branchCodePlaceholder')}
						/>
						<p className="text-xs text-muted-foreground">
							{t('onboarding.branchCodeHint')}
						</p>
					</div>
				</div>

				<div className="flex justify-between">
					<Button variant="outline" onClick={onBack}>
						{t('back')}
					</Button>
					<Button
						onClick={onNext}
						disabled={!data.branchName.trim() || !data.branchCode.trim()}
					>
						{t('onboarding.continue')}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
