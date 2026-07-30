import { cn } from '@repo/ui';

interface AvatarButtonProps {
	initials: string;
	label: string;
	onClick: () => void;
	className?: string;
}

/**
 * The app bar's trailing identity button. Mobile only: from `md` up the sidebar footer
 * carries the same identity, so the design drops it from the bar.
 */
export function AvatarButton({ initials, label, onClick, className }: AvatarButtonProps) {
	return (
		<button
			type="button"
			onClick={onClick}
			aria-label={label}
			className={cn(
				'flex size-9 shrink-0 items-center justify-center rounded-xl bg-tone-indigo-bg text-[13.5px] font-bold text-tone-indigo-fg',
				className,
			)}
		>
			{initials}
		</button>
	);
}
