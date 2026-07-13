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
	const canProceed =
		data.ownerFirstName.trim() &&
		data.ownerLastName.trim() &&
		UZ_PHONE_REGEX.test(data.ownerPhone) &&
		data.ownerPassword.length >= 8;

	return (
		<Card>
			<CardContent className="flex flex-col gap-6 pt-6">
				<div>
					<p className="text-base font-semibold">Owner account</p>
					<p className="text-sm text-muted-foreground">
						The first account — receives the OWNER role with full access.
					</p>
				</div>

				<div className="flex flex-col gap-4">
					<div className="grid grid-cols-2 gap-3">
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="owner-first-name">First name</Label>
							<Input
								id="owner-first-name"
								value={data.ownerFirstName}
								onChange={(e) =>
									onChange({ ownerFirstName: e.target.value })
								}
								placeholder="Aziz"
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="owner-last-name">Last name</Label>
							<Input
								id="owner-last-name"
								value={data.ownerLastName}
								onChange={(e) =>
									onChange({ ownerLastName: e.target.value })
								}
								placeholder="Yusupov"
							/>
						</div>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="owner-phone">Phone number</Label>
						<PhoneInput
							id="owner-phone"
							value={data.ownerPhone}
							onChange={(value) => onChange({ ownerPhone: value })}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="owner-email">
							Email{' '}
							<span className="text-muted-foreground">(optional)</span>
						</Label>
						<Input
							id="owner-email"
							type="email"
							value={data.ownerEmail}
							onChange={(e) => onChange({ ownerEmail: e.target.value })}
							placeholder="aziz@zabon.uz"
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="owner-password">Temporary password</Label>
						<PasswordInput
							id="owner-password"
							value={data.ownerPassword}
							onChange={(e) => onChange({ ownerPassword: e.target.value })}
							placeholder="Min. 8 characters"
						/>
						<p className="text-xs text-muted-foreground">
							The owner should change this on first login.
						</p>
					</div>
				</div>

				<div className="flex justify-between">
					<Button variant="outline" onClick={onBack}>
						Back
					</Button>
					<Button onClick={onNext} disabled={!canProceed}>
						Continue
					</Button>
				</div>
			</CardContent>
		</Card>
	);
}
