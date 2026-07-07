import { env } from './env';

/**
 * Extracts the tenant slug from the leftmost subdomain label.
 * Falls back to VITE_DEV_TENANT for local dev on plain localhost.
 * Returns null if no tenant can be determined (edge case).
 *
 * Examples:
 *   zabon.cohort.uz        → "zabon"
 *   zabon.localhost:5174    → "zabon"
 *   localhost:5174          → env.VITE_DEV_TENANT ?? null
 */
export function getTenantSlug(): string | null {
	const hostname = window.location.hostname;
	const parts = hostname.split('.');

	if (parts.length > 1 && parts[0] !== 'www') {
		return parts[0];
	}

	return env.VITE_DEV_TENANT ?? null;
}
