export type FeatureKey =
	| 'billing'
	| 'payroll'
	| 'assessments'
	| 'telegram_bot'
	| 'api_access';

export const FEATURE_LABELS: Record<FeatureKey, { label: string; description: string }> =
	{
		billing: {
			label: 'Billing module',
			description: 'Invoices, payments & revenue tracking',
		},
		payroll: {
			label: 'Payroll module',
			description: 'Staff salary & payslip management',
		},
		assessments: {
			label: 'Assessments',
			description: 'Tests, grades & progress tracking',
		},
		telegram_bot: {
			label: 'Telegram bot',
			description: 'Parent notifications via Telegram',
		},
		api_access: {
			label: 'API access',
			description: 'REST API key for integrations',
		},
	};

export const ALL_FEATURES = Object.keys(FEATURE_LABELS) as FeatureKey[];
