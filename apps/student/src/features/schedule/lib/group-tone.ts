import type { StatusTone } from '@repo/ui';

/**
 * The rotation the design assigns per group (indigo → cyan → violet → …). The backend
 * carries no colour for a group, so the tone is derived deterministically from the group
 * id — stable across screens and sessions, which is all the colour-keying needs.
 */
const GROUP_TONES: StatusTone[] = ['indigo', 'cyan', 'violet', 'blue', 'pink', 'orange'];

/** Deterministic accent tone for a group — the design's per-group colour keying. */
export function groupTone(groupId: number): StatusTone {
	return GROUP_TONES[Math.abs(groupId) % GROUP_TONES.length] as StatusTone;
}
