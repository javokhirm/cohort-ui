import { useState } from 'react';

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Label,
	PhoneInput,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui';

import type { TenantDetailView, UpdateTenantInput } from '@/api/tenants/types';
import { useAppT } from '@/locales';

export function SettingsTab({
	tenant,
	onSave,
	saving,
}: {
	tenant: TenantDetailView;
	onSave: (data: UpdateTenantInput) => void;
	saving: boolean;
}) {
	const t = useAppT('tenants');
	const [timezone, setTimezone] = useState(tenant.timezone);
	const [locale, setLocale] = useState(tenant.locale);
	const [phone, setPhone] = useState(tenant.phone ?? '');
	const [city, setCity] = useState(tenant.city ?? '');

	return (
		<div className="flex max-w-lg flex-col gap-6">
			<Card className="gap-0 py-0">
				<CardHeader className="border-b border-border px-5 py-4">
					<CardTitle className="text-sm font-semibold">
						{t('settings.general')}
					</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4 px-5 py-5">
					<div className="flex flex-col gap-1.5">
						<Label>{t('settings.displayName')}</Label>
						<Input value={tenant.name} disabled />
						<p className="text-xs text-muted-foreground">
							{t('settings.displayNameHint')}
						</p>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="settings-phone">{t('settings.phone')}</Label>
						<PhoneInput
							id="settings-phone"
							value={phone}
							onChange={setPhone}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="settings-city">{t('onboarding.city')}</Label>
						<Input
							id="settings-city"
							value={city}
							onChange={(e) => setCity(e.target.value)}
							placeholder={t('onboarding.cityPlaceholder')}
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label>{t('onboarding.timezone')}</Label>
						<Select value={timezone} onValueChange={setTimezone}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="Asia/Tashkent">
									Asia/Tashkent (UTC+5)
								</SelectItem>
								<SelectItem value="Europe/Moscow">
									Europe/Moscow (UTC+3)
								</SelectItem>
								<SelectItem value="UTC">UTC</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label>{t('onboarding.language')}</Label>
						<Select value={locale} onValueChange={setLocale}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="uz">{t('settings.langUz')}</SelectItem>
								<SelectItem value="ru">{t('settings.langRu')}</SelectItem>
								<SelectItem value="en">{t('settings.langEn')}</SelectItem>
							</SelectContent>
						</Select>
					</div>
					<div className="pt-1">
						<Button
							disabled={saving}
							onClick={() =>
								onSave({
									timezone,
									locale,
									phone: phone || null,
									city: city || null,
								})
							}
						>
							{saving ? t('settings.saving') : t('settings.save')}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
