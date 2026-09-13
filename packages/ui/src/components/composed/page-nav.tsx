import * as React from 'react';
import { ChevronLeft } from 'lucide-react';

import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from '@repo/ui/components/breadcrumb';
import { Button } from '@repo/ui/components/button';
import { Separator } from '@repo/ui/components/separator';
import { cn } from '@repo/ui/lib/utils';

export interface PageNavCrumb {
	/** The crumb's text. The last crumb in the trail is the current screen. */
	label: React.ReactNode;
	/**
	 * Router link element for this crumb — e.g. `<Link to="/groups" />`.
	 * Rendered through `asChild`, and cloned with {@link PageNavCrumb.label} as
	 * its children, so pass the element *without* children and keep the text in
	 * one place. Omit entirely for a crumb that is not navigable.
	 *
	 * Taking an element rather than an href is what lets this package stay free
	 * of a routing dependency while the app keeps type-safe `to`/`params`.
	 */
	link?: React.ReactElement;
}

interface PageNavProps extends Omit<React.ComponentProps<'div'>, 'children'> {
	/**
	 * The trail, root first. Two or three entries is the useful range — below
	 * that the sidebar already says where you are, and a one-crumb trail is
	 * noise.
	 */
	crumbs?: PageNavCrumb[];
	/**
	 * Return to the previous screen. Omit on screens that have no meaningful
	 * "back" and the control is not rendered at all.
	 */
	onBack?: () => void;
	/** Accessible name for the back control — it is icon-only. */
	backLabel?: string;
}

/**
 * The nav strip that sits above a screen's `PageHeader`: a back control, then
 * the breadcrumb trail.
 *
 * The two answer different questions and are not redundant — the trail says
 * *where am I and what is this nested under*, the button says *return to where
 * I actually came from*, which is often not the trail's parent (a student
 * opened from a group roster, an invoice opened from the dashboard). The button
 * is icon-only precisely so it does not restate a label the trail already
 * carries.
 */
function PageNav({ className, crumbs, onBack, backLabel, ...props }: PageNavProps) {
	const hasCrumbs = crumbs != null && crumbs.length > 0;

	if (!hasCrumbs && !onBack) return null;

	return (
		<div
			data-slot="page-nav"
			className={cn('flex min-h-8 items-center gap-2', className)}
			{...props}
		>
			{onBack && (
				<>
					<Button
						type="button"
						variant="ghost"
						size="icon"
						aria-label={backLabel}
						onClick={onBack}
						className="-ml-2 size-8 shrink-0 text-muted-foreground hover:text-foreground"
					>
						<ChevronLeft className="size-6" strokeWidth={2.2} />
					</Button>
					{hasCrumbs && (
						<Separator orientation="vertical" className="h-4 shrink-0" />
					)}
				</>
			)}

			{hasCrumbs && (
				<Breadcrumb className="min-w-0">
					<BreadcrumbList>
						{crumbs.map((crumb, index) => {
							const isLast = index === crumbs.length - 1;

							return (
								// Crumbs are a fixed trail for the screen, not a
								// reorderable list — the index is a stable key.
								<React.Fragment key={index}>
									<BreadcrumbItem>
										{isLast || !crumb.link ? (
											<BreadcrumbPage>{crumb.label}</BreadcrumbPage>
										) : (
											<BreadcrumbLink asChild>
												{React.cloneElement(
													crumb.link as React.ReactElement<{
														children?: React.ReactNode;
													}>,
													{ children: crumb.label },
												)}
											</BreadcrumbLink>
										)}
									</BreadcrumbItem>
									{!isLast && <BreadcrumbSeparator />}
								</React.Fragment>
							);
						})}
					</BreadcrumbList>
				</Breadcrumb>
			)}
		</div>
	);
}

export { PageNav };
export type { PageNavProps };
