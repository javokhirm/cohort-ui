import * as React from 'react';
import { Slot as SlotPrimitive } from 'radix-ui';
import { ChevronRight } from 'lucide-react';

import { cn } from '../lib/utils';

/**
 * shadcn/ui breadcrumb primitives.
 *
 * Deliberately router-agnostic, like every other component in this package:
 * `BreadcrumbLink` renders through `asChild`, so an app passes its own router
 * link (`<BreadcrumbLink asChild><Link to="/groups">…</Link></BreadcrumbLink>`)
 * and `@repo/ui` never takes a dependency on a routing library.
 *
 * Most screens should reach for {@link PageNav} rather than assembling these
 * by hand — it fixes the trail's shape so every page's chrome matches.
 */
function Breadcrumb({ ...props }: React.ComponentProps<'nav'>) {
	return <nav data-slot="breadcrumb" aria-label="breadcrumb" {...props} />;
}

function BreadcrumbList({ className, ...props }: React.ComponentProps<'ol'>) {
	return (
		<ol
			data-slot="breadcrumb-list"
			className={cn(
				'flex flex-wrap items-center gap-1.5 text-sm break-words text-muted-foreground',
				className,
			)}
			{...props}
		/>
	);
}

function BreadcrumbItem({ className, ...props }: React.ComponentProps<'li'>) {
	return (
		<li
			data-slot="breadcrumb-item"
			className={cn('inline-flex items-center gap-1.5', className)}
			{...props}
		/>
	);
}

function BreadcrumbLink({
	asChild = false,
	className,
	...props
}: React.ComponentProps<'a'> & { asChild?: boolean }) {
	const Comp = asChild ? SlotPrimitive.Root : 'a';

	return (
		<Comp
			data-slot="breadcrumb-link"
			className={cn(
				'rounded-sm transition-colors hover:text-foreground focus-visible:ring-[3px] focus-visible:ring-ring/40 focus-visible:outline-none',
				className,
			)}
			{...props}
		/>
	);
}

/** The trail's last entry — the screen you are on, so it is text, not a link. */
function BreadcrumbPage({ className, ...props }: React.ComponentProps<'span'>) {
	return (
		<span
			data-slot="breadcrumb-page"
			role="link"
			aria-disabled="true"
			aria-current="page"
			className={cn('font-medium text-foreground', className)}
			{...props}
		/>
	);
}

function BreadcrumbSeparator({
	children,
	className,
	...props
}: React.ComponentProps<'li'>) {
	return (
		<li
			data-slot="breadcrumb-separator"
			role="presentation"
			aria-hidden="true"
			className={cn('[&>svg]:size-3.5', className)}
			{...props}
		>
			{children ?? <ChevronRight />}
		</li>
	);
}

export {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
};
