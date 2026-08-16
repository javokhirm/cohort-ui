/**
 * A plausible sample value per template variable, so a rendered preview reads
 * like a real message rather than a skeleton of empty strings. Names not listed
 * fall back to the variable's own name, which still shows where it lands in the
 * sentence.
 *
 * **Mirrors the backend's `VARIABLE_EXAMPLES`** (`domain/communication/defaults/
 * template-variable-examples.ts`) value for value, and must stay in sync with it.
 * That map is what the backend submits to Eskiz for SMS moderation, so a preview
 * built from the same values is the same text a moderator — and a recipient —
 * actually reads. Two consequences that look like bugs but aren't:
 *
 * - Money is the raw shape a `decimal` column stringifies to (`1500000` — no
 *   thousands separator, no trailing `.00`), **not** `formatPrice` output. These
 *   are substitution literals standing in for the server renderer's output, not
 *   money rendered by this UI, so the shared formatters deliberately don't apply.
 * - Dates are the renderer's `YYYY-MM-DD`, not a locale-formatted date.
 *
 * Shared by the template sheet and the inline template editor.
 */
const SAMPLES: Record<string, string> = {
	// Free text a center or a parent typed.
	centerName: 'Ravnaq Talim',
	studentName: 'Anvar Tursunov',
	parentName: 'Dilnoza Yusupova',
	groupName: '789-A',
	assessmentName: 'IELTS Mock Test',
	tierName: 'Standart',

	// Money. Rendered straight off a `decimal` column, so the sample keeps the
	// same shape: no thousands separator, no trailing `.00`.
	amount: '1500000',
	lateFeeAmount: '50000',
	remainingBalance: '250000',

	// Codes and dates: rendered verbatim off their column, same as above.
	currency: 'UZS',
	invoiceNumber: 'INV-00042',
	dueDate: '2026-08-20',
	sessionDate: '2026-08-16',
	paidAt: '2026-08-16',
	expiresAt: '2026-08-31',
	expiredAt: '2026-08-10',
	periodEnd: '2026-08-31',

	// Plain integers.
	daysUntilDue: '3',
	daysOverdue: '5',
	daysRemaining: '7',

	// Not a trigger-catalog variable — the dispatcher supplies it from the
	// resolved recipient, so no backend example covers it and the server's own
	// unknown-name fallback (a generic full name) is what it would render.
	recipientName: 'Anvar Tursunov',
};

export function sampleFor(name: string): string {
	return SAMPLES[name] ?? name;
}

/**
 * Render a body for the live preview by substituting every `{{name}}` with its
 * sample value. Mirrors the backend renderer's grammar (and its "unknown → the
 * name itself" is our own softer choice: staff still see where a variable lands,
 * whereas the server would render an unknown one empty). Nothing is ever sent.
 */
export function renderWithSamples(body: string): string {
	return body.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, name: string) =>
		sampleFor(name),
	);
}

/** Variable names referenced by `{{name}}` in a body, de-duplicated. */
export function referencedVariables(body: string): string[] {
	const found = new Set<string>();
	for (const match of body.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)) {
		found.add(match[1]);
	}
	return [...found];
}
