import { useState } from 'react';
import { MessageSquare, RefreshCw, Send } from 'lucide-react';

import { isApiError } from '@repo/api-client';
import {
	Alert,
	AlertDescription,
	Button,
	Card,
	CardContent,
	EmptyState,
	Label,
	PageHeader,
	PhoneInput,
	Spinner,
	Textarea,
	toast,
} from '@repo/ui';
import { formatPrice, UZ_PHONE_REGEX } from '@repo/utils';

import { DefaultTemplatesTable } from '@/features/sms-settings/components/DefaultTemplatesTable';
import {
	usePlatformDefaultTemplates,
	usePlatformSmsBalance,
	usePlatformSmsStatus,
	usePlatformTemplateModeration,
	useSyncPlatformTemplateModeration,
	useTestPlatformSms,
} from '@/features/sms-settings/hooks';
import { useAppT } from '@/locales';

/**
 * The platform's own (shared/default) Eskiz SMS account — the one every tenant
 * without its own credentials resolves to (`apps/admin`'s SMS settings page hides
 * balance/test/sync for those tenants precisely because this screen is where that
 * account now lives). Nothing here is tenant-scoped: one account, one balance, one
 * moderation ledger for the code-owned default templates.
 */
export function SettingsPage() {
	const t = useAppT('smsSettings');

	const { data: status, isLoading, isError } = usePlatformSmsStatus();
	const configured = status?.configured ?? false;

	const {
		data: balance,
		isFetching: isBalanceFetching,
		refetch: refetchBalance,
	} = usePlatformSmsBalance(configured);
	const { data: templates, isLoading: templatesLoading } =
		usePlatformDefaultTemplates();
	const { data: moderation } = usePlatformTemplateModeration();

	const testMutation = useTestPlatformSms();
	const syncMutation = useSyncPlatformTemplateModeration();

	const [testPhone, setTestPhone] = useState('');
	const [testMessage, setTestMessage] = useState('');

	const handleTest = async () => {
		if (!UZ_PHONE_REGEX.test(testPhone)) {
			toast.error(t('test.invalidPhone'));
			return;
		}
		try {
			const result = await testMutation.mutateAsync({
				phone: testPhone,
				message: testMessage.trim() === '' ? undefined : testMessage.trim(),
			});
			if (result.success) toast.success(t('test.success'));
			else toast.error(t('test.failure', { error: result.error ?? '' }));
		} catch (err) {
			toast.error(isApiError(err) ? err.message : t('test.requestFailed'));
		}
	};

	const handleSync = async () => {
		try {
			const result = await syncMutation.mutateAsync();
			toast.success(
				t('moderation.syncResult', {
					submitted: result.submitted,
					matched: result.matched,
					skipped: result.skipped,
					failed: result.failed,
				}),
			);
		} catch (err) {
			toast.error(isApiError(err) ? err.message : t('moderation.syncFailed'));
		}
	};

	if (isLoading) {
		return (
			<div className="flex items-center justify-center py-16 text-muted-foreground">
				<Spinner className="size-5" />
			</div>
		);
	}

	if (isError || !status) {
		return (
			<Alert variant="destructive">
				<AlertDescription>{t('loadError')}</AlertDescription>
			</Alert>
		);
	}

	return (
		<div className="flex flex-col gap-6">
			<PageHeader title={t('title')} description={t('description')} />

			{!configured && (
				<Alert variant="destructive">
					<AlertDescription>{t('notConfigured')}</AlertDescription>
				</Alert>
			)}

			<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
				<Card>
					<CardContent className="flex flex-col gap-4">
						<div className="flex items-start justify-between gap-3">
							<div className="flex flex-col gap-0.5">
								<span className="text-sm font-semibold">
									{t('balance.title')}
								</span>
								<span className="text-xs text-muted-foreground">
									{t('accountMeta', {
										provider: status.provider,
										sender: status.senderName ?? '—',
									})}
								</span>
							</div>
							{configured && (
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
							)}
						</div>

						{configured ? (
							balance?.amount != null ? (
								<span className="text-2xl font-bold tabular-nums">
									{formatPrice(balance.amount)}{' '}
									{balance.currency ?? 'UZS'}
								</span>
							) : (
								<span className="text-sm text-muted-foreground">
									{t('balance.unknown')}
								</span>
							)
						) : (
							<span className="text-sm text-muted-foreground">
								{t('balance.unavailable')}
							</span>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardContent className="flex flex-col gap-4">
						<div className="flex flex-col gap-0.5">
							<span className="text-sm font-semibold">
								{t('test.title')}
							</span>
							<p className="text-xs text-muted-foreground">
								{t('test.description')}
							</p>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="testPhone">{t('test.phone')}</Label>
							<PhoneInput
								id="testPhone"
								value={testPhone}
								onChange={setTestPhone}
								disabled={!configured}
							/>
						</div>
						<div className="flex flex-col gap-1.5">
							<Label htmlFor="testMessage">{t('test.message')}</Label>
							<Textarea
								id="testMessage"
								value={testMessage}
								onChange={(e) => setTestMessage(e.target.value)}
								placeholder={t('test.messagePlaceholder')}
								rows={3}
								disabled={!configured}
							/>
						</div>
						<Button
							className="w-full"
							onClick={() => void handleTest()}
							disabled={!configured || testMutation.isPending}
						>
							{testMutation.isPending ? (
								<Spinner className="mr-1.5 size-4" />
							) : (
								<Send className="mr-1.5 size-4" />
							)}
							{t('test.send')}
						</Button>
					</CardContent>
				</Card>
			</div>

			<Card>
				<CardContent className="flex flex-col gap-4">
					<div className="flex items-center justify-between gap-3">
						<div className="flex flex-col gap-0.5">
							<span className="text-sm font-semibold">
								{t('defaults.title')}
							</span>
							<p className="text-xs text-muted-foreground">
								{t('defaults.description')}
							</p>
						</div>
						<Button
							variant="outline"
							size="sm"
							onClick={() => void handleSync()}
							disabled={!configured || syncMutation.isPending}
						>
							{syncMutation.isPending ? (
								<Spinner className="mr-1.5 size-4" />
							) : (
								<RefreshCw className="mr-1.5 size-4" />
							)}
							{t('moderation.sync')}
						</Button>
					</div>

					{templatesLoading ? (
						<div className="flex items-center justify-center py-10 text-muted-foreground">
							<Spinner className="size-5" />
						</div>
					) : !templates || templates.length === 0 ? (
						<EmptyState
							icon={<MessageSquare />}
							title={t('defaults.empty')}
						/>
					) : (
						<DefaultTemplatesTable
							templates={templates}
							moderation={moderation}
						/>
					)}
				</CardContent>
			</Card>
		</div>
	);
}
