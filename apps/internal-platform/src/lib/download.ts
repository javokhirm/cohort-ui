import { env } from './env';
import { getAccessToken } from '../store/sessionStore';

/**
 * File downloads from the super-admin API.
 *
 * These deliberately bypass `superAdminApi`: that client unwraps the standard
 * JSON envelope (`{ success, data, meta }`) off every response, which a raw CSV
 * body does not have — it would read `success` off a Blob, find it undefined, and
 * throw while trying to build an `ApiError` out of nothing. So endpoints that
 * return a file are fetched directly, with the bearer token attached by hand.
 *
 * Consequence worth knowing: there is no automatic 401-refresh here. A download
 * attempted with a stale token fails once and the user retries — acceptable for a
 * button they pressed, and far better than teaching the envelope-unwrapping client
 * to sometimes not unwrap.
 */

const apiBase = `${env.VITE_API_ORIGIN}/api/v1/super-admin`;

/** Hand `blob` to the browser as a file download named `fileName`. */
export function saveBlob(blob: Blob, fileName: string): void {
	const url = URL.createObjectURL(blob);
	const anchor = document.createElement('a');
	anchor.href = url;
	anchor.download = fileName;
	document.body.appendChild(anchor);
	anchor.click();
	anchor.remove();
	// Release the object URL once the click has been dispatched; holding it would
	// pin the blob in memory for the life of the page.
	URL.revokeObjectURL(url);
}

/** GET a file from the super-admin API and save it. Throws on a non-2xx. */
export async function downloadFile(path: string, fileName: string): Promise<void> {
	const token = getAccessToken();
	const response = await fetch(`${apiBase}${path}`, {
		headers: token ? { Authorization: `Bearer ${token}` } : {},
	});

	if (!response.ok) {
		throw new Error(`Download failed (${response.status}). Please try again.`);
	}

	saveBlob(await response.blob(), fileName);
}

/** Save `text` as a file the user downloads — used for the CSV template. */
export function saveTextFile(text: string, fileName: string): void {
	saveBlob(new Blob([text], { type: 'text/csv;charset=utf-8' }), fileName);
}
