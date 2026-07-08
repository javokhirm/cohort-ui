export interface RoleView {
	id: number;
	name: string;
	description: string | null;
	isSystem: boolean;
	editable: boolean;
	permissions: string[];
}

export interface PermissionDef {
	id: number;
	code: string;
	description: string;
}

export interface PermissionGroup {
	domain: string;
	permissions: PermissionDef[];
}

export interface PermissionCatalog {
	groups: PermissionGroup[];
	total: number;
}

export interface UpdateRolePermissionsInput {
	permissionCodes: string[];
}
