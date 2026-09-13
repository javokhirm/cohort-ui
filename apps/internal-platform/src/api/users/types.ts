export type UserDirectoryStatus = 'active' | 'invited' | 'inactive';

export interface UserTenantSummary {
	tenantId: number;
	name: string;
	status: string;
}

export interface UserDirectoryRow {
	id: number;
	/** `null` for a person the platform holds no number for (see `UserDetailView`). */
	phone: string | null;
	email: string | null;
	firstName: string;
	lastName: string;
	isActive: boolean;
	status: UserDirectoryStatus;
	lastLoginAt: string | null;
	membershipCount: number;
	tenants: UserTenantSummary[];
}

export interface UserMembershipDetail {
	tenantId: number;
	tenant: { id: number; name: string; status: string };
	status: string;
	joinedAt: string | null;
	roles: string[];
}

export interface UserDetailView {
	id: number;
	/**
	 * `null` when no number is on file. Only accounts that sign in by phone are
	 * guaranteed one; students authenticate with a `studentCode` and parents not
	 * at all.
	 */
	phone: string | null;
	email: string | null;
	firstName: string;
	lastName: string;
	avatarUrl: string | null;
	isActive: boolean;
	status: UserDirectoryStatus;
	lastLoginAt: string | null;
	createdAt: string;
	memberships: UserMembershipDetail[];
}

export interface UserSummaryView {
	id: number;
	phone: string | null;
	email: string | null;
	firstName: string;
	lastName: string;
	isActive: boolean;
	lastLoginAt: string | null;
}

export interface UserListFilters {
	search?: string;
	status?: UserDirectoryStatus;
	page?: number;
	limit?: number;
}

export interface ResetPasswordInput {
	newPassword: string;
}
