import { useEffect, useRef } from 'react';

interface UseInfiniteScrollSentinelOptions {
	hasNextPage: boolean | undefined;
	isFetchingNextPage: boolean;
	fetchNextPage: () => unknown;
	rootMargin?: string;
}

/**
 * Auto-loads the next page once the returned sentinel ref scrolls into view.
 */
export function useInfiniteScrollSentinel({
	hasNextPage,
	isFetchingNextPage,
	fetchNextPage,
	rootMargin = '300px',
}: UseInfiniteScrollSentinelOptions) {
	const sentinelRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		const el = sentinelRef.current;
		if (!el || !hasNextPage) return;
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && !isFetchingNextPage) void fetchNextPage();
			},
			{ rootMargin },
		);
		observer.observe(el);
		return () => observer.disconnect();
	}, [hasNextPage, isFetchingNextPage, fetchNextPage, rootMargin]);

	return sentinelRef;
}
