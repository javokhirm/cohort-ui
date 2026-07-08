import { AVATAR_PALETTE } from './constants';

export function avatarClass(id: number): string {
	return AVATAR_PALETTE[id % AVATAR_PALETTE.length];
}

export function getInitials(name: string): string {
	return name
		.split(' ')
		.slice(0, 2)
		.map((w) => w[0])
		.join('')
		.toUpperCase();
}
