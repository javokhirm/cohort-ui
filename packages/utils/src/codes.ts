/**
 * Parse a dotted backend code string (e.g. "PEOPLE.STUDENT_NOT_FOUND")
 * into its domain and key segments.
 */
export function parseApiCode(code: string): { domain: string; key: string } {
	const dot = code.indexOf('.');
	if (dot === -1) return { domain: '', key: code };
	return { domain: code.slice(0, dot), key: code.slice(dot + 1) };
}
