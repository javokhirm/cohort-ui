import { isApiError } from '@repo/api-client';

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Separator,
	Spinner,
} from '@repo/ui';

import { useDeactivateUser } from '../hooks';
import { useAppT } from '@/locales';
import { useT } from '@repo/i18n';

export function DeactivateDialog({
	userId,
	fullName,
	open,
	onOpenChange,
}: {
	userId: number;
	fullName: string;
	open: boolean;
	onOpenChange: (open: boolean) => void;
}) {
	const tt = useAppT('tenants');
	const t = useAppT('users');
	const tc = useT('common');
	const mutation = useDeactivateUser(userId, {
		onSuccess: () => onOpenChange(false),
	});

	function handleOpenChange(nextOpen: boolean) {
		if (!nextOpen) mutation.reset();
		onOpenChange(nextOpen);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-sm">
				<DialogHeader>
					<DialogTitle>{t('deactivateTitle')}</DialogTitle>
					<DialogDescription>
						{t('deactivateDescription', { name: fullName })}
					</DialogDescription>
				</DialogHeader>
				<Separator />
				{mutation.isError && (
					<p className="text-sm text-destructive">
						{isApiError(mutation.error)
							? mutation.error.message
							: t('deactivateError')}
					</p>
				)}
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => handleOpenChange(false)}
						disabled={mutation.isPending}
					>
						{tc('action.cancel')}
					</Button>
					<Button
						variant="destructive"
						disabled={mutation.isPending}
						onClick={() => mutation.mutate()}
					>
						{mutation.isPending && <Spinner className="mr-2 size-4" />}
						{tt('danger.deactivate')}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
