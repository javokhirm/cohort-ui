export const platformSmsKeys = {
	all: ['platformSms'] as const,
	status: () => [...platformSmsKeys.all, 'status'] as const,
	balance: () => [...platformSmsKeys.all, 'balance'] as const,
	defaults: () => [...platformSmsKeys.all, 'defaults'] as const,
	moderation: () => [...platformSmsKeys.all, 'moderation'] as const,
};
