import { manageApi } from '@/api/apiClient';
import { useSessionStore } from '@/store/sessionStore';

/**
 * The authenticated staff member's profile from `GET /manage/me`
 * (mirrors backend `CurrentUserProfile`, api-reference §3). `permissions` is the
 * session's **server-resolved** permission codes — the same source the backend's
 * `RbacGuard` enforces — used to gate the UI by permission (not just by role).
 */
export interface ManageProfile {
	id: number;
	firstName: string;
	lastName: string;
	email: string | null;
	phone: string;
	avatarUrl: string | null;
	/** Role names from the access token (e.g. `['OWNER']`). */
	roles: string[];
	/** Branch ids the principal is scoped to, or `null` for all branches. */
	branchScope: number[] | null;
	/** Effective permission codes (e.g. `['student.read']`), sorted, deduped. */
	permissions: string[];
}

/** Fetch the current staff member's profile + resolved permission codes. */
export function fetchManageProfile(): Promise<ManageProfile> {
	return manageApi.get<ManageProfile>('/me');
}

/**
 * Load `/manage/me` and push the resolved permission codes into the session
 * store. Best-effort: on failure permissions stay unloaded and gates fail open
 * (the server still enforces every rule), so a transient `/me` error never locks
 * a signed-in user out of the console. Requires an authenticated session (the
 * access token must already be set) before it is called.
 */
export async function loadPermissions(): Promise<void> {
	try {
		const profile = await fetchManageProfile();
		useSessionStore.getState().setPermissions(profile.permissions);
	} catch {
		/* leave permissionsLoaded=false → gates fail open; server enforces */
	}
}
