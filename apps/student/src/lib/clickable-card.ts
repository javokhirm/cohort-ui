import type { KeyboardEvent } from 'react';

/**
 * The props that turn a `Card` into something a keyboard can actually operate.
 *
 * Several of Home's cards are whole-surface targets — the next class, the latest
 * mark, the leaderboard standing. `Card` renders a plain `<div>`, so an `onClick`
 * alone leaves them invisible to Tab, unannounced to a screen reader, and dead to
 * Enter and Space. They cannot simply become `<button>`s: each one nests
 * headings, badges and progress bars, which is not valid button content.
 *
 * So the element keeps its role explicitly. `role="button"` announces it,
 * `tabIndex={0}` puts it in the tab order, and the key handler restores the
 * activation behaviour a real button gets for free — Enter on keydown, Space on
 * keydown with `preventDefault` so the page does not scroll out from under the
 * press.
 *
 * Callers add their own `focus-visible:` ring; the visual is theirs, the
 * behaviour is here. `BalanceDueBanner` is a real `<button>` and needs none of
 * this — reach for that first, and for this only when the content forbids it.
 */
export function clickableCardProps(onActivate: () => void) {
	return {
		role: 'button',
		tabIndex: 0,
		onClick: onActivate,
		onKeyDown: (event: KeyboardEvent<HTMLElement>) => {
			// Ignore keys that bubbled up from a control inside the card — its own
			// Enter/Space belongs to it, not to the card wrapping it.
			if (event.target !== event.currentTarget) return;
			if (event.key !== 'Enter' && event.key !== ' ') return;
			event.preventDefault();
			onActivate();
		},
	} as const;
}
