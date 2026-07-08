export const AVATAR_PALETTE = [
	'bg-tone-indigo-bg text-tone-indigo-fg',
	'bg-tone-violet-bg text-tone-violet-fg',
	'bg-tone-cyan-bg text-tone-cyan-fg',
	'bg-tone-green-bg text-tone-green-fg',
	'bg-tone-red-bg text-tone-red-fg',
	'bg-tone-blue-bg text-tone-blue-fg',
	'bg-tone-amber-bg text-tone-amber-fg',
	'bg-tone-pink-bg text-tone-pink-fg',
	'bg-tone-orange-bg text-tone-orange-fg',
	'bg-tone-slate-bg text-tone-slate-fg',
];

export function getInitials(name: string): string {
	return name
		.split(' ')
		.slice(0, 2)
		.map((w) => w[0])
		.join('')
		.toUpperCase();
}

export function avatarClass(id: number): string {
	return AVATAR_PALETTE[id % AVATAR_PALETTE.length];
}
