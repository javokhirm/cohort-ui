export interface AuditActorView {
	userId: number | null;
	name: string | null;
	role: string | null;
}

export interface AuditTenantView {
	id: number;
	name: string;
	subdomain: string;
}

export interface AuditLogView {
	id: number;
	timestamp: string;
	actor: AuditActorView;
	tenant: AuditTenantView | null;
	action: string;
	entityType: string | null;
	entityId: number | null;
	ipAddress: string | null;
	details: {
		before: Record<string, unknown> | null;
		after: Record<string, unknown> | null;
	};
}

export interface AuditLogFilters {
	tenantId?: number;
	actorUserId?: number;
	action?: string;
	from?: string;
	to?: string;
	search?: string;
	page?: number;
	limit?: number;
}
