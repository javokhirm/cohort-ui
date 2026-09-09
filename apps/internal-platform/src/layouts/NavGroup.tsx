import { useT } from '@repo/i18n';

import type { NavGroupDef } from './nav';
import { NavButton } from './NavButton';

interface NavGroupProps {
	group: NavGroupDef;
	collapsed: boolean;
	pathname: string;
	size?: 'compact' | 'touch';
	onNavigate?: () => void;
}

/** One labelled group of nav rows, shared by the rail and the drawer. */
export function NavGroup({
	group,
	collapsed,
	pathname,
	size = 'compact',
	onNavigate,
}: NavGroupProps) {
	const t = useT('nav');

	return (
		<div className="flex flex-col gap-0.5">
			{!collapsed && (
				<div className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-widest text-(--console-muted-fg)">
					{t(`group.${group.label}`)}
				</div>
			)}
			{group.items.map((item) => (
				<NavButton
					key={item.id}
					item={item}
					active={pathname === item.match}
					collapsed={collapsed}
					size={size}
					onNavigate={onNavigate}
				/>
			))}
		</div>
	);
}
