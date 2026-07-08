import type { StatusTone } from '@repo/ui';

export const PAGE_SIZE = 10;

export const AVATAR_PALETTE = [
	'bg-tone-green-bg text-tone-green-fg',
	'bg-tone-indigo-bg text-tone-indigo-fg',
	'bg-tone-violet-bg text-tone-violet-fg',
	'bg-tone-blue-bg text-tone-blue-fg',
	'bg-tone-cyan-bg text-tone-cyan-fg',
	'bg-tone-pink-bg text-tone-pink-fg',
	'bg-tone-amber-bg text-tone-amber-fg',
	'bg-tone-orange-bg text-tone-orange-fg',
	'bg-tone-red-bg text-tone-red-fg',
	'bg-tone-slate-bg text-tone-slate-fg',
];

export const TENANT_AVATAR_PALETTE = [
	'bg-tone-indigo-bg text-tone-indigo-fg',
	'bg-tone-violet-bg text-tone-violet-fg',
	'bg-tone-cyan-bg text-tone-cyan-fg',
	'bg-tone-green-bg text-tone-green-fg',
	'bg-tone-pink-bg text-tone-pink-fg',
	'bg-tone-blue-bg text-tone-blue-fg',
	'bg-tone-amber-bg text-tone-amber-fg',
	'bg-tone-orange-bg text-tone-orange-fg',
	'bg-tone-red-bg text-tone-red-fg',
	'bg-tone-slate-bg text-tone-slate-fg',
];

export const ROLE_TONES: Record<string, StatusTone> = {
	OWNER: 'violet',
	ADMIN: 'blue',
	MANAGER: 'cyan',
	TEACHER: 'slate',
};
