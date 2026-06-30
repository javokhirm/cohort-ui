import { useState } from 'react';

import {
	Button,
	Card,
	CardContent,
	CardHeader,
	CardTitle,
	Input,
	Label,
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from '@repo/ui';

import type { TenantDetailView, UpdateTenantInput } from '@/api/tenants/types';

export function SettingsTab({
	tenant,
	onSave,
	saving,
}: {
	tenant: TenantDetailView;
	onSave: (data: UpdateTenantInput) => void;
	saving: boolean;
}) {
	const [timezone, setTimezone] = useState(tenant.timezone);
	const [locale, setLocale] = useState(tenant.locale);
	const [phone, setPhone] = useState(tenant.phone ?? '');
	const [city, setCity] = useState(tenant.city ?? '');

	return (
		<div className="flex max-w-lg flex-col gap-6">
			<Card className="gap-0 py-0">
				<CardHeader className="border-b border-border px-5 py-4">
					<CardTitle className="text-sm font-semibold">General</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-4 px-5 py-5">
					<div className="flex flex-col gap-1.5">
						<Label>Display name</Label>
						<Input value={tenant.name} disabled />
						<p className="text-xs text-muted-foreground">
							Tenant name cannot be changed from the platform console.
						</p>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="settings-phone">Phone</Label>
						<Input
							id="settings-phone"
							type="tel"
							value={phone}
							onChange={(e) => setPhone(e.target.value)}
							placeholder="+998 90 000 00 00"
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label htmlFor="settings-city">City</Label>
						<Input
							id="settings-city"
							value={city}
							onChange={(e) => setCity(e.target.value)}
							placeholder="Tashkent"
						/>
					</div>
					<div className="flex flex-col gap-1.5">
						<Label>Timezone</Label>
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
						<Label>Language</Label>
						<Select value={locale} onValueChange={setLocale}>
							<SelectTrigger>
								<SelectValue />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="uz">Uzbek (Latin)</SelectItem>
								<SelectItem value="ru">Russian</SelectItem>
								<SelectItem value="en">English</SelectItem>
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
							{saving ? 'Saving…' : 'Save changes'}
						</Button>
					</div>
				</CardContent>
			</Card>
		</div>
	);
}
