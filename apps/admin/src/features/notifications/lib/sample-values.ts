/**
 * A plausible sample value per template variable, so a rendered preview reads
 * like a real message rather than a skeleton of empty strings. Names not listed
 * fall back to the variable's own name, which still shows where it lands in the
 * sentence.
 *
 * Shared by the template sheet and the inline template editor.
 */
const SAMPLES: Record<string, string> = {
	centerName: 'Bright Future',
	studentName: 'Ali Valiyev',
	parentName: 'Aziza Valiyeva',
	recipientName: 'Aziza Valiyeva',
	amount: '450 000',
	lateFeeAmount: '25 000',
	remainingBalance: '150 000',
	currency: 'UZS',
	invoiceNumber: 'INV-2026-00042',
	dueDate: '2026-07-01',
	paidAt: '2026-06-28',
	sessionDate: '2026-06-26',
	groupName: 'IELTS Morning A',
	assessmentName: 'Unit 4 Test',
	daysUntilDue: '3',
	daysOverdue: '5',
	daysRemaining: '7',
	expiresAt: '2026-08-01',
	expiredAt: '2026-08-01',
	periodEnd: '2026-09-01',
	tierName: 'Pro',
	reason: '—',
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
