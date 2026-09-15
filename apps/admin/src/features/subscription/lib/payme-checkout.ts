import type { PaymeCheckoutForm } from '../api/subscription.mutations';

/**
 * Handing the payer off to Payme's hosted checkout.
 *
 * Two constraints shape this:
 *
 * 1. **POST the form, don't follow the link.** Only `checkoutForm` carries the
 *    fiscal `detail` Payme prints a compliant receipt from — its GET parameter
 *    set has nowhere to put it (cohort-be api-reference §1.2). `checkoutUrl` is
 *    the same order by another route, kept for the browsers that block us.
 * 2. **The tab must be opened inside the click.** `window.open` after an
 *    `await` has lost the user gesture and is popup-blocked, so the caller
 *    opens a blank named tab first and the form targets it once
 *    `POST /subscription/renew` comes back.
 *
 * Neither the URL nor the form is authoritative: the amount and account travel
 * unsigned, and Payme re-validates both against our own record before charging
 * anything. Nothing here may be treated as proof of what is owed.
 */

/** Shared by the blank tab and the form's `target`, so the POST lands in the tab we opened. */
const CHECKOUT_WINDOW_NAME = 'cohort-payme-checkout';

/** Opens the tab the checkout is submitted into. `null` when the browser blocked it. */
export function openCheckoutWindow(): Window | null {
	return window.open('', CHECKOUT_WINDOW_NAME);
}

/** Renders the descriptor as a hidden form and submits it into {@link openCheckoutWindow}'s tab. */
export function submitCheckoutForm(checkout: PaymeCheckoutForm): void {
	const form = document.createElement('form');
	form.method = checkout.method;
	form.action = checkout.action;
	form.target = CHECKOUT_WINDOW_NAME;
	form.hidden = true;

	for (const [name, value] of Object.entries(checkout.fields)) {
		const input = document.createElement('input');
		input.type = 'hidden';
		input.name = name;
		input.value = value;
		form.appendChild(input);
	}

	document.body.appendChild(form);
	form.submit();
	form.remove();
}
