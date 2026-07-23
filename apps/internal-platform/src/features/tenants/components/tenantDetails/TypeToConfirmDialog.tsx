import { useState } from 'react';

import {
	Button,
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	Input,
	Label,
} from '@repo/ui';
import { useT } from '@repo/i18n';

interface TypeToConfirmDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	confirmLabel: string;
	tenantName: string;
	onConfirm: () => void;
	loading?: boolean;
	variant?: 'default' | 'destructive';
}

export function TypeToConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	confirmLabel,
	tenantName,
	onConfirm,
	loading = false,
	variant = 'default',
}: TypeToConfirmDialogProps) {
	const tc = useT('common');
	const [value, setValue] = useState('');

	function handleOpenChange(next: boolean) {
		if (!next) setValue('');
		onOpenChange(next);
	}

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-w-md">
				<DialogHeader>
					<DialogTitle>{title}</DialogTitle>
					<DialogDescription>{description}</DialogDescription>
				</DialogHeader>
				<div className="flex flex-col gap-2">
					<Label htmlFor="type-confirm-input">
						Type <strong>{tenantName}</strong> to confirm
					</Label>
					<Input
						id="type-confirm-input"
						value={value}
						onChange={(e) => setValue(e.target.value)}
						placeholder={tenantName}
					/>
				</div>
				<DialogFooter>
					<Button variant="outline" onClick={() => handleOpenChange(false)}>
						{tc('action.cancel')}
					</Button>
					<Button
						variant={variant === 'destructive' ? 'destructive' : 'default'}
						disabled={value !== tenantName || loading}
						onClick={onConfirm}
					>
						{loading ? 'Processing…' : confirmLabel}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
