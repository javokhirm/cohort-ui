import {
	Sheet,
	SheetContent,
	SheetDescription,
	SheetFooter,
	SheetHeader,
	SheetTitle,
} from '@repo/ui';

interface FormSheetProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description?: string;
	children: React.ReactNode;
	footer?: React.ReactNode;
	maxWidth?: 'sm' | 'md' | 'lg';
}

const MAX_WIDTH: Record<NonNullable<FormSheetProps['maxWidth']>, string> = {
	sm: 'sm:max-w-sm',
	md: 'sm:max-w-md',
	lg: 'sm:max-w-lg',
};

export function FormSheet({
	open,
	onOpenChange,
	title,
	description,
	children,
	footer,
	maxWidth = 'md',
}: FormSheetProps) {
	return (
		<Sheet open={open} onOpenChange={onOpenChange}>
			<SheetContent className={`flex flex-col gap-0 ${MAX_WIDTH[maxWidth]}`}>
				<SheetHeader className="shrink-0 px-6 pb-4 pt-6 border-b">
					<SheetTitle>{title}</SheetTitle>
					{description && <SheetDescription>{description}</SheetDescription>}
				</SheetHeader>

				<div className="flex-1 overflow-y-auto bg-muted p-4">{children}</div>

				{footer && (
					<SheetFooter className="flex-row gap-2 border-t bg-card px-6 py-4 *:flex-1">
						{footer}
					</SheetFooter>
				)}
			</SheetContent>
		</Sheet>
	);
}
