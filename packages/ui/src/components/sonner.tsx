import { Toaster as Sonner, toast, type ToasterProps } from 'sonner';

/**
 * Toast host. Mount once near the app root. Trigger toasts with the exported
 * `toast()` helper. Colors map to the design tokens, so toasts follow light/
 * dark automatically (no `next-themes` needed in this Vite SPA).
 */
function Toaster(props: ToasterProps) {
	return (
		<Sonner
			data-slot="toaster"
			className="toaster group"
			style={
				{
					'--normal-bg': 'var(--popover)',
					'--normal-text': 'var(--popover-foreground)',
					'--normal-border': 'var(--border)',
					'--border-radius': 'var(--radius)',
				} as ToasterProps['style']
			}
			{...props}
		/>
	);
}

export { Toaster, toast };
