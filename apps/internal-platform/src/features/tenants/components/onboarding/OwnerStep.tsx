import {
	Button,
	Card,
	CardContent,
	Input,
	Label,
	PasswordInput,
	PhoneInput,
} from '@repo/ui';
import { UZ_PHONE_REGEX } from '@repo/utils';

import type { OnboardFormData } from './types';
import { useAppT } from '@/locales';

export function OwnerStep({
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
	const canProceed =
		data.ownerFirstName.trim() &&
		data.ownerLastName.trim() &&
		UZ_PHONE_REGEX.test(data.ownerPhone) &&
		data.ownerPassword.length >= 8;

	return (
		<Card>
			<CardContent className="flex flex-col gap-6 pt-6">
				<div>
					<p className="text-base font-semibold">
						{t('onboarding.ownerTitle')}
					</p>
					<p className="text-sm text-muted-foreground">
						{t('onboarding.ownerSubtitle')}
					</p>
				</div>

				<div className="flex flex-col gap-4">
					<div className="grid grid-cols-2 gap-3">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="owner-first-name">
								{t('onboarding.firstName')}
							</Label>
							<Input
								id="owner-first-name"
								value={data.ownerFirstName}
								onChange={(e) =>
									onChange({ ownerFirstName: e.target.value })
								}
								placeholder={t('onboarding.ownerFirstNamePlaceholder')}
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="owner-last-name">
								{t('onboarding.lastName')}
							</Label>
							<Input
								id="owner-last-name"
								value={data.ownerLastName}
								onChange={(e) =>
									onChange({ ownerLastName: e.target.value })
								}
								placeholder={t('onboarding.ownerLastNamePlaceholder')}
							/>
						</div>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="owner-phone">{t('onboarding.phoneNumber')}</Label>
						<PhoneInput
							id="owner-phone"
							value={data.ownerPhone}
							onChange={(value) => onChange({ ownerPhone: value })}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="owner-email">
							{t('onboarding.email')}{' '}
							<span className="text-muted-foreground">
								{t('onboarding.optional')}
							</span>
						</Label>
						<Input
							id="owner-email"
							type="email"
							value={data.ownerEmail}
							onChange={(e) => onChange({ ownerEmail: e.target.value })}
							placeholder={t('onboarding.ownerEmailPlaceholder')}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="owner-password">
							{t('onboarding.tempPassword')}
						</Label>
						<PasswordInput
							id="owner-password"
							value={data.ownerPassword}
							onChange={(e) => onChange({ ownerPassword: e.target.value })}
							placeholder={t('onboarding.newPasswordPlaceholder')}
						/>
						<p className="text-xs text-muted-foreground">
							{t('onboarding.ownerPasswordHint')}
						</p>
					</div>
				</div>

				<div className="flex justify-between">
					<Button variant="outline" onClick={onBack}>
						{t('back')}
					</Button>
					<Button onClick={onNext} disabled={!canProceed}>
						{t('onboarding.continue')}
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
