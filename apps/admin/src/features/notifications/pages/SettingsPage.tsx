import { useState } from 'react';
import { AlertTriangle, Info, Lock, MessageSquare, RefreshCw, Send } from 'lucide-react';

import { isApiError } from '@repo/api-client';
import {
	Alert,
	AlertDescription,
	Button,
	Card,
	CardContent,
	Input,
	Label,
	PasswordInput,
	PhoneInput,
	Separator,
	Spinner,
	Switch,
	Textarea,
	toast,
} from '@repo/ui';
import { useT } from '@repo/i18n';
import { formatDateTime, formatPrice, UZ_PHONE_REGEX } from '@repo/utils';

import { useAppT } from '@/locales';

import {
	useChannelBalance,
	useChannelSettings,
	type ChannelSetting,
} from '../api/notifications.queries';
import { useTestChannel, useUpsertChannelSetting } from '../api/notifications.mutations';

/**
 * SMS settings — the master switch and everything behind it.
 *
 * Deliberately **not** a React Hook Form sheet like the other editors: this is a
 * settings page with a live status panel (balance, messages sent today,
 * operational state) rather than a create/edit dialog, and the credential fields
 * are write-only with "omit to keep" semantics that a normal form's dirty-tracking
 * would fight. Local state plus one explicit save keeps that honest.
 *
 * This is the loader half: fetch the channel list, then hand the SMS row to the
 * form. The split exists so the form's local state can be seeded with plain
 * `useState` initialisers rather than a setState-in-effect, which causes cascading
 * renders. The `key` re-seeds the form after a save by remounting it — the
 * idiomatic "reset state when the identity changes" pattern.
 */
export function SettingsPage() {
	const tn = useAppT('notifications');
	const { data: channels, isLoading, isError } = useChannelSettings();

	const sms = channels?.find((channel) => channel.channel === 'SMS');

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16 text-muted-foreground">
				<Spinner className="size-5" />
			</div>
		);
	}

	if (isError || !sms) {
		return (
			<Alert variant="destructive">
				<AlertDescription>{tn('settings.loadError')}</AlertDescription>
			</Alert>
		);
	}

	return <SmsSettingsForm key={sms.updatedAt ?? 'new'} setting={sms} />;
}

function SmsSettingsForm({ setting: sms }: { setting: ChannelSetting }) {
	const tn = useAppT('notifications');
	const tc = useT('common');

	const upsert = useUpsertChannelSetting();
	const testChannel = useTestChannel();

	// Balance is only meaningful once credentials resolve; asking otherwise 400s.
	const {
		data: balance,
		dataUpdatedAt: balanceFetchedAt,
		isFetching: isBalanceFetching,
		refetch: refetchBalance,
	} = useChannelBalance('SMS', sms.isOperational);

	// --- local form state, seeded from the loaded setting ---------------------
	const [isEnabled, setIsEnabled] = useState(sms.isEnabled);
	const [senderName, setSenderName] = useState(sms.senderName ?? '');
	const [dailyLimit, setDailyLimit] = useState(
		sms.dailyLimit != null ? String(sms.dailyLimit) : '',
	);
	const [useOwnCredentials, setUseOwnCredentials] = useState(sms.hasOwnCredentials);
	// The secret fields always start empty — the API does not return them, by design.
	const [login, setLogin] = useState('');
	const [password, setPassword] = useState('');
	const [testPhone, setTestPhone] = useState('');
	const [testMessage, setTestMessage] = useState('');

	const save = async (options: { clearCredentials?: boolean } = {}) => {
		// Credentials: both or neither. Omitting the field keeps what is stored, so a
		// half-filled pair means the operator was mid-edit rather than clearing.
		let credentials: { login: string; password: string } | null | undefined;
		if (options.clearCredentials) {
			credentials = null;
		} else if (useOwnCredentials && (login !== '' || password !== '')) {
			if (login === '' || password === '') {
				toast.error(tn('settings.validation.credentialsPair'));
				return;
			}
			credentials = { login, password };
		} else if (!useOwnCredentials && sms.hasOwnCredentials) {
			// The operator switched back to the platform account.
			credentials = null;
		}

		try {
			await upsert.mutateAsync({
				channel: 'SMS',
				isEnabled,
				senderName: senderName.trim() === '' ? null : senderName.trim(),
				credentials,
				dailyLimit: dailyLimit.trim() === '' ? null : Number(dailyLimit),
			});
			toast.success(
				options.clearCredentials
					? tn('settings.credentials.cleared')
					: tn('settings.saved'),
			);
			setLogin('');
			setPassword('');
		} catch (err) {
			toast.error(isApiError(err) ? err.message : tn('settings.saveFailed'));
		}
	};

	const sendTest = async () => {
		if (!UZ_PHONE_REGEX.test(testPhone)) {
			toast.error(tn('settings.test.failure', { error: tc('state.none') }));
			return;
		}
		try {
			const result = await testChannel.mutateAsync({
				channel: 'SMS',
				phone: testPhone,
				message: testMessage.trim() === '' ? undefined : testMessage.trim(),
			});
			// The endpoint reports credential failures as data, not an exception —
			// branching on `success` is what surfaces "your password is wrong".
			if (result.success) toast.success(tn('settings.test.success'));
			else {
				toast.error(tn('settings.test.failure', { error: result.error ?? '' }));
			}
		} catch (err) {
			toast.error(isApiError(err) ? err.message : tn('settings.testFailed'));
		}
	};

	const providerLabel = sms.provider.charAt(0).toUpperCase() + sms.provider.slice(1);

	return (
		<div className="flex flex-col gap-6">
			{sms.isEnabled && !sms.isOperational && (
				<Alert variant="destructive">
					<AlertTriangle />
					<AlertDescription>{tn('settings.notOperational')}</AlertDescription>
				</Alert>
			)}

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.3fr_1fr]">
				<div className="flex flex-col gap-6">
					<Card>
						<CardContent className="flex flex-col gap-4">
							<div className="flex items-center justify-between gap-4">
								<div className="flex items-center gap-3">
									<div className="flex size-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
										<MessageSquare className="size-5" />
									</div>
									<div className="flex flex-col gap-0.5">
										<span className="text-sm font-semibold">
											{tn('settings.channelCard.title')}
										</span>
										<span className="text-xs text-muted-foreground">
											{sms.updatedAt
												? tn('settings.channelCard.meta', {
														provider: providerLabel,
														date: formatDateTime(
															sms.updatedAt,
														),
													})
												: tn('settings.channelCard.metaNoDate', {
														provider: providerLabel,
													})}
										</span>
									</div>
								</div>
								<Switch
									checked={isEnabled}
									onCheckedChange={setIsEnabled}
									aria-label={tn('settings.masterSwitch')}
								/>
							</div>
							<Separator />
							<p className="text-sm text-muted-foreground">
								{tn('settings.masterSwitchHint')}
							</p>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="flex flex-col gap-4">
							<span className="text-sm font-semibold">
								{tn('settings.senderLimits.title')}
							</span>
							<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
								<div className="flex flex-col gap-1.5">
									<Label htmlFor="senderName">
										{tn('settings.field.senderName')}
									</Label>
									<Input
										id="senderName"
										value={senderName}
										onChange={(e) => setSenderName(e.target.value)}
										placeholder="4546"
									/>
									<p className="text-xs text-muted-foreground">
										{tn('settings.field.senderNameHint')}
									</p>
								</div>
								<div className="flex flex-col gap-1.5">
									<Label htmlFor="dailyLimit">
										{tn('settings.field.dailyLimit')}
									</Label>
									<Input
										id="dailyLimit"
										type="number"
										min={1}
										value={dailyLimit}
										onChange={(e) => setDailyLimit(e.target.value)}
									/>
								</div>
							</div>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="flex flex-col gap-4">
							<span className="text-sm font-semibold">
								{tn('settings.credentials.title')}
							</span>

							<div className="flex items-center justify-between gap-4">
								<div className="flex flex-col gap-0.5">
									<span className="text-sm font-semibold">
										{tn('settings.credentials.useOwn')}
									</span>
									<span className="text-xs text-muted-foreground">
										{tn('settings.credentials.useOwnHint')}
									</span>
								</div>
								<Switch
									checked={useOwnCredentials}
									onCheckedChange={setUseOwnCredentials}
								/>
							</div>

							{useOwnCredentials && (
								<>
									<Separator />
									{/*
									 * Gateway approval is granted per account: an
									 * account switch inherits none of the platform's
									 * approvals, so SMS goes quiet until the
									 * resubmitted copy clears. Saying so here is the
									 * difference between an expected pause and a
									 * support ticket.
									 */}
									<Alert>
										<Info className="size-4" />
										<AlertDescription>
											{tn('settings.credentials.moderationNote')}
										</AlertDescription>
									</Alert>
									<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
										<div className="flex flex-col gap-1.5">
											<Label htmlFor="smsLogin">
												{tn('settings.field.login')}
											</Label>
											<Input
												id="smsLogin"
												value={login}
												onChange={(e) => setLogin(e.target.value)}
												placeholder={
													sms.maskedLogin ??
													'center@example.com'
												}
												autoComplete="off"
											/>
										</div>
										<div className="flex flex-col gap-1.5">
											<Label htmlFor="smsPassword">
												{tn('settings.field.password')}
											</Label>
											<PasswordInput
												id="smsPassword"
												value={password}
												onChange={(e) =>
													setPassword(e.target.value)
												}
												autoComplete="new-password"
											/>
										</div>
									</div>
									<div className="flex flex-wrap items-center justify-between gap-3">
										<p className="text-xs text-muted-foreground">
											{tn('settings.field.credentialsHint')}
										</p>
										{sms.hasOwnCredentials && (
											<Button
												variant="outline"
												size="sm"
												className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"
												onClick={() =>
													void save({ clearCredentials: true })
												}
												disabled={upsert.isPending}
											>
												{tn('settings.credentials.clear')}
											</Button>
										)}
									</div>
								</>
							)}

							<Separator />
							<div className="flex flex-wrap items-center justify-between gap-3">
								<span className="text-xs text-muted-foreground">
									{sms.hasOwnCredentials
										? tn('settings.credentials.usingOwn', {
												login: sms.maskedLogin ?? '',
											})
										: tn('settings.credentials.usingPlatform')}
								</span>
								<Button
									onClick={() => void save()}
									disabled={upsert.isPending}
								>
									{upsert.isPending && (
										<Spinner className="mr-1.5 size-4" />
									)}
									{tc('action.save')}
								</Button>
							</div>
						</CardContent>
					</Card>
				</div>

				<div className="flex flex-col gap-6">
					{sms.isOperational && (
						<Card>
							<CardContent className="flex flex-col gap-4">
								<div className="flex items-start justify-between gap-3">
									<div className="flex flex-col gap-0.5">
										<span className="text-sm font-semibold">
											{tn('settings.balance.title')}
										</span>
										{balanceFetchedAt > 0 && (
											<span className="text-xs text-muted-foreground">
												{tn('settings.balance.fetched', {
													date: formatDateTime(
														new Date(
															balanceFetchedAt,
														).toISOString(),
													),
												})}
											</span>
										)}
									</div>
									<Button
										variant="outline"
										size="icon"
										className="size-8"
										onClick={() => void refetchBalance()}
										disabled={isBalanceFetching}
									>
										{isBalanceFetching ? (
											<Spinner className="size-4" />
										) : (
											<RefreshCw className="size-4" />
										)}
									</Button>
								</div>

								{balance?.amount != null ? (
									<span className="text-2xl font-bold tabular-nums">
										{formatPrice(balance.amount)}{' '}
										{balance.currency ?? 'UZS'}
									</span>
								) : (
									<span className="text-sm text-muted-foreground">
										{tn('settings.balanceUnknown')}
									</span>
								)}
							</CardContent>
						</Card>
					)}

					<Card>
						<CardContent className="flex flex-col gap-4">
							<div className="flex flex-col gap-0.5">
								<span className="text-sm font-semibold">
									{tn('settings.test.title')}
								</span>
								<p className="text-xs text-muted-foreground">
									{tn('settings.test.description')}
								</p>
							</div>
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="testPhone">
									{tn('settings.test.phone')}
								</Label>
								<PhoneInput
									id="testPhone"
									value={testPhone}
									onChange={setTestPhone}
								/>
							</div>
							<div className="flex flex-col gap-1.5">
								<Label htmlFor="testMessage">
									{tn('settings.test.message')}
								</Label>
								<Textarea
									id="testMessage"
									value={testMessage}
									onChange={(e) => setTestMessage(e.target.value)}
									placeholder={tn('settings.test.messagePlaceholder')}
									rows={3}
								/>
							</div>
							<Button
								className="w-full"
								onClick={() => void sendTest()}
								disabled={testChannel.isPending}
							>
								{testChannel.isPending ? (
									<Spinner className="mr-1.5 size-4" />
								) : (
									<Send className="mr-1.5 size-4" />
								)}
								{tn('settings.test.send')}
							</Button>
						</CardContent>
					</Card>

					<Card>
						<CardContent className="flex flex-col gap-2">
							<div className="flex items-center gap-2 text-sm font-semibold">
								<Lock className="size-4 text-muted-foreground" />
								{tn('settings.ownerOnly.title')}
							</div>
							<p className="text-xs text-muted-foreground">
								{tn('settings.ownerOnly.description')}
							</p>
						</CardContent>
					</Card>
				</div>
			</div>
		</div>
	);
}
