import { useNavigate, useRouter } from '@tanstack/react-router';
import type {
	AnyRouter,
	NavigateOptions,
	RegisteredRouter,
} from '@tanstack/react-router';

/**
 * "Back to where I actually came from."
 *
 * A detail screen usually has several entrances — a student is opened from the
 * students list, from a lead, and from a group roster — so a hard-coded parent
 * link is wrong for every entrance but one. Popping history returns to the real
 * previous screen *with its own search params intact*, which is what restores
 * the list's filters, page and open tab for free.
 *
 * `fallback` covers the case history cannot: a URL opened directly — a fresh
 * tab, a bookmark, a link pasted into Telegram — where there is no entry to pop.
 * It navigates with `replace` so the landing screen does not stack a second
 * entry behind the one the user arrived on.
 *
 * The generics mirror `navigate`'s own, so `to` still narrows `params` and
 * `search` at the call site; only the internal hand-off needs a cast.
 */
export function useGoBack<
	TRouter extends AnyRouter = RegisteredRouter,
	const TFrom extends string = string,
	const TTo extends string | undefined = undefined,
	const TMaskFrom extends string = TFrom,
	const TMaskTo extends string = '',
>(fallback: NavigateOptions<TRouter, TFrom, TTo, TMaskFrom, TMaskTo>): () => void {
	const router = useRouter();
	const navigate = useNavigate();

	return () => {
		if (router.history.canGoBack()) {
			router.history.back();
			return;
		}
		void navigate({ ...fallback, replace: true } as NavigateOptions);
	};
}
