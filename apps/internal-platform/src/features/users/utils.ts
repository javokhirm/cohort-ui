import type { StatusTone } from '@repo/ui';

import { AVATAR_PALETTE, ROLE_TONES, TENANT_AVATAR_PALETTE } from './constants';

export function getInitials(firstName: string, lastName: string): string {
	return `${firstName[0] ?? ''}${lastName[0] ?? ''}`.toUpperCase();
}

export function avatarClass(id: number): string {
	return AVATAR_PALETTE[id % AVATAR_PALETTE.length];
}

export function tenantAvatarClass(tenantId: number): string {
	return TENANT_AVATAR_PALETTE[tenantId % TENANT_AVATAR_PALETTE.length];
}

export function roleTone(role: string): StatusTone {
	return ROLE_TONES[role] ?? 'slate';
}
