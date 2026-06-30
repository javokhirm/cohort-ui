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
					<DialogTitle>Deactivate user</DialogTitle>
					<DialogDescription>
						This will revoke <strong>{fullName}</strong>'s access across all tenants.
						They will not be able to log in until reactivated.
					</DialogDescription>
				</DialogHeader>
				<Separator />
				{mutation.isError && (
					<p className="text-sm text-destructive">
						{isApiError(mutation.error)
							? mutation.error.message
							: 'Failed to deactivate user. Please try again.'}
					</p>
				)}
				<DialogFooter>
					<Button
						variant="outline"
						onClick={() => handleOpenChange(false)}
						disabled={mutation.isPending}
					>
						Cancel
					</Button>
					<Button
						variant="destructive"
						disabled={mutation.isPending}
						onClick={() => mutation.mutate()}
					>
						{mutation.isPending && <Spinner className="mr-2 size-4" />}
						Deactivate
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
