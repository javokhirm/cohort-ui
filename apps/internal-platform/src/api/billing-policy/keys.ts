/**
 * One policy per tenant, addressed by tenant id — so the detail key is scoped by
 * `tenantId` rather than being a singleton (the console moves between tenants).
 */
export const billingPolicyKeys = {
	all: ['billing-policy'] as const,
	detail: (tenantId: number) => [...billingPolicyKeys.all, 'detail', tenantId] as const,
};
