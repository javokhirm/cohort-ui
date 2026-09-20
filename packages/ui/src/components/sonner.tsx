import { Toaster as Sonner, toast, type ToasterProps } from 'sonner';

/**
 * Toast host. Mount once near the app root. Trigger toasts with the exported
 * `toast()` helper. `richColors` is on, so `toast.success` reads green and
 * `toast.error` red (`toast()` itself stays neutral). Every color maps to a
 * design token, so toasts follow light/dark automatically (no `next-themes`
 * needed in this Vite SPA).
 */
function Toaster(props: ToasterProps) {
	return (
		<Sonner
			data-slot="toaster"
			className="toaster group"
			richColors
			style={
				{
					'--normal-bg': 'var(--popover)',
					'--normal-text': 'var(--popover-foreground)',
					'--normal-border': 'var(--border)',
					'--success-bg': 'var(--toast-success-bg)',
					'--success-text': 'var(--toast-success-fg)',
					'--success-border': 'var(--toast-success-border)',
					'--error-bg': 'var(--toast-error-bg)',
					'--error-text': 'var(--toast-error-fg)',
					'--error-border': 'var(--toast-error-border)',
					'--warning-bg': 'var(--toast-warning-bg)',
					'--warning-text': 'var(--toast-warning-fg)',
					'--warning-border': 'var(--toast-warning-border)',
					'--info-bg': 'var(--toast-info-bg)',
					'--info-text': 'var(--toast-info-fg)',
					'--info-border': 'var(--toast-info-border)',
					'--border-radius': 'var(--radius)',
				} as ToasterProps['style']
			}
			{...props}
		/>
	);
}

export { Toaster, toast };
