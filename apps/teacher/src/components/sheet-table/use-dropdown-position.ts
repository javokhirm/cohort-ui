import * as React from 'react';

/**
 * Positions a cell's dropdown panel in viewport coordinates, for a panel
 * portalled to `document.body`.
 *
 * The panel can't simply be absolutely positioned inside its cell: the grid
 * scrolls on both axes, and a scroll container clips its overflow — so a panel
 * opened on the last row or the right-most column would be cut off. Portalling
 * sidesteps the clipping, and this hook supplies the coordinates, flipping the
 * panel above its trigger when there's no room below and clamping it inside the
 * viewport horizontally. `size` is the panel's expected footprint; it only has
 * to be close enough to decide the flip.
 */
export function useDropdownPosition(
	open: boolean,
	triggerRef: React.RefObject<HTMLElement | null>,
	size: { width: number; height: number },
) {
	const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(
		null,
	);
	const { width, height } = size;

	React.useEffect(() => {
		if (!open) return;
		const margin = 8;
		const update = () => {
			const rect = triggerRef.current?.getBoundingClientRect();
			if (!rect) return;
			const below = rect.bottom + 4;
			const fitsBelow = below + height + margin <= window.innerHeight;
			setCoords({
				top: fitsBelow ? below : Math.max(margin, rect.top - 4 - height),
				left: Math.min(
					Math.max(margin, rect.left),
					Math.max(margin, window.innerWidth - width - margin),
				),
			});
		};
		update();
		window.addEventListener('scroll', update, true);
		window.addEventListener('resize', update);
		return () => {
			window.removeEventListener('scroll', update, true);
			window.removeEventListener('resize', update);
		};
	}, [open, triggerRef, width, height]);

	return open ? coords : null;
}
