import * as React from 'react';
import { Tabs as TabsPrimitive } from 'radix-ui';
import { cva } from 'class-variance-authority';

import { cn } from '../lib/utils';

type TabsVariant = 'pill' | 'underline';

const TabsVariantContext = React.createContext<TabsVariant>('underline');

function Tabs({
	className,
	variant = 'underline',
	...props
}: React.ComponentProps<typeof TabsPrimitive.Root> & { variant?: TabsVariant }) {
	return (
		<TabsVariantContext.Provider value={variant}>
			<TabsPrimitive.Root
				data-slot="tabs"
				className={cn('flex flex-col gap-2', className)}
				{...props}
			/>
		</TabsVariantContext.Provider>
	);
}

const tabsListVariants = cva('inline-flex items-center text-muted-foreground', {
	variants: {
		variant: {
			pill: 'h-9 w-fit justify-center rounded-lg bg-muted p-1',
			underline:
				'h-auto w-full justify-start gap-1 rounded-none border-b border-border bg-transparent p-0',
		},
	},
	defaultVariants: {
		variant: 'underline',
	},
});

function TabsList({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
	const variant = React.useContext(TabsVariantContext);
	return (
		<TabsPrimitive.List
			data-slot="tabs-list"
			className={cn(tabsListVariants({ variant }), className)}
			{...props}
		/>
	);
}

const tabsTriggerVariants = cva(
	"inline-flex items-center justify-center gap-1.5 text-sm font-medium whitespace-nowrap transition-[color,box-shadow] focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
	{
		variants: {
			variant: {
				pill: 'h-7 flex-1 rounded-md border border-transparent px-3 py-1 data-[state=active]:bg-card data-[state=active]:text-foreground data-[state=active]:shadow-xs',
				underline:
					'cursor-pointer -mb-px h-auto flex-none rounded-none border-x-0 border-t-0 border-b-2 border-transparent px-3.5 pb-2.5 pt-2 shadow-none transition-colors hover:text-foreground data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:font-semibold data-[state=active]:text-foreground data-[state=active]:shadow-none',
			},
		},
		defaultVariants: {
			variant: 'underline',
		},
	},
);

function TabsTrigger({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
	const variant = React.useContext(TabsVariantContext);
	return (
		<TabsPrimitive.Trigger
			data-slot="tabs-trigger"
			className={cn(tabsTriggerVariants({ variant }), className)}
			{...props}
		/>
	);
}

function TabsContent({
	className,
	...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
	return (
		<TabsPrimitive.Content
			data-slot="tabs-content"
			className={cn('flex-1 outline-none', className)}
			{...props}
		/>
	);
}

export { Tabs, TabsList, TabsTrigger, TabsContent };
