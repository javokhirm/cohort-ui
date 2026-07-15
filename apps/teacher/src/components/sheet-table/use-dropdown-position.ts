import * as React from 'react';

/**
 * Dropdown panels anchor inside a table with two ancestors that clip
 * overflow (the horizontally-scrolling middle region and the vertically-
 * scrolling outer card) — per the CSS overflow spec, setting `overflow-x`
 * alone forces `overflow-y` to compute as `auto` too, so a plain
 * `position: absolute` panel gets clipped whenever its cell has no extra
 * space below it (e.g. the last row). Portaling to `document.body` and
 * positioning from the trigger's own rect sidesteps both ancestors' clipping.
 */
export function useDropdownPosition(
	open: boolean,
	triggerRef: React.RefObject<HTMLElement | null>,
) {
	const [coords, setCoords] = React.useState<{ top: number; left: number } | null>(
		null,
	);

	React.useEffect(() => {
		if (!open) return;
		const update = () => {
			const rect = triggerRef.current?.getBoundingClientRect();
			if (rect) setCoords({ top: rect.bottom + 4, left: rect.left });
		};
		update();
		window.addEventListener('scroll', update, true);
		window.addEventListener('resize', update);
		return () => {
			window.removeEventListener('scroll', update, true);
			window.removeEventListener('resize', update);
		};
	}, [open, triggerRef]);

	return open ? coords : null;
}
