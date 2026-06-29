/**
 * Mock user data for the User Directory and User Detail pages.
 * TODO: replace with useQuery(usersQuery()) once GET /admin/users is ready.
 */

export type UserRole = 'OWNER' | 'ADMIN' | 'MANAGER' | 'TEACHER';

export type TenantMembership = {
	tenantId: string;
	tenantName: string;
	subdomain: string;
	role: UserRole;
	status: 'active' | 'suspended';
};

export type MockUser = {
	id: string;
	name: string;
	email: string;
	phone: string;
	memberships: TenantMembership[];
};

export const MOCK_USERS: MockUser[] = [
	// ── Page 1 ──────────────────────────────────────────────────────────────
	{
		id: 'usr-001',
		name: 'Aziz Yusupov',
		email: 'aziz@zabon.uz',
		phone: '+998 90 123 45 67',
		memberships: [
			{
				tenantId: 'ten-001',
				tenantName: 'Zabon Language Center',
				subdomain: 'zabon',
				role: 'OWNER',
				status: 'active',
			},
			{
				tenantId: 'ten-003',
				tenantName: 'Bright Future School',
				subdomain: 'bright-future',
				role: 'ADMIN',
				status: 'active',
			},
		],
	},
	{
		id: 'usr-002',
		name: 'Dilnoza Karimova',
		email: 'dilnoza@ielts-master.uz',
		phone: '+998 90 234 56 78',
		memberships: [
			{
				tenantId: 'ten-002',
				tenantName: 'IELTS Master Academy',
				subdomain: 'ielts-master',
				role: 'OWNER',
				status: 'active',
			},
		],
	},
	{
		id: 'usr-003',
		name: 'Jasur Rakhimov',
		email: 'jasur@bright-future.uz',
		phone: '+998 90 345 67 89',
		memberships: [
			{
				tenantId: 'ten-003',
				tenantName: 'Bright Future School',
				subdomain: 'bright-future',
				role: 'OWNER',
				status: 'active',
			},
			{
				tenantId: 'ten-001',
				tenantName: 'Zabon Language Center',
				subdomain: 'zabon',
				role: 'TEACHER',
				status: 'active',
			},
		],
	},
	{
		id: 'usr-004',
		name: 'Nodira Saidova',
		email: 'nodira@cambridge.uz',
		phone: '+998 90 456 78 90',
		memberships: [
			{
				tenantId: 'ten-004',
				tenantName: 'Cambridge Tashkent',
				subdomain: 'cambridge',
				role: 'OWNER',
				status: 'active',
			},
		],
	},
	{
		id: 'usr-005',
		name: 'Bekzod Tursunov',
		email: 'bekzod@eduon.uz',
		phone: '+998 90 567 89 01',
		memberships: [
			{
				tenantId: 'ten-005',
				tenantName: 'Eduon Academy',
				subdomain: 'eduon',
				role: 'OWNER',
				status: 'active',
			},
		],
	},
	{
		id: 'usr-006',
		name: 'Kamola Abdullaeva',
		email: 'kamola@lingua-pro.uz',
		phone: '+998 90 678 90 12',
		memberships: [
			{
				tenantId: 'ten-006',
				tenantName: 'Lingua Pro Center',
				subdomain: 'lingua-pro',
				role: 'OWNER',
				status: 'active',
			},
			{
				tenantId: 'ten-001',
				tenantName: 'Zabon Language Center',
				subdomain: 'zabon',
				role: 'MANAGER',
				status: 'active',
			},
		],
	},
	// ── Page 2 ──────────────────────────────────────────────────────────────
	{
		id: 'usr-007',
		name: 'Sardor Nazarov',
		email: 'sardor@spark-academy.uz',
		phone: '+998 90 789 01 23',
		memberships: [
			{
				tenantId: 'ten-007',
				tenantName: 'Spark Academy',
				subdomain: 'spark-academy',
				role: 'OWNER',
				status: 'active',
			},
		],
	},
	{
		id: 'usr-008',
		name: 'Malika Yusupova',
		email: 'malika@prestige.uz',
		phone: '+998 90 890 12 34',
		memberships: [
			{
				tenantId: 'ten-008',
				tenantName: 'Prestige Language Center',
				subdomain: 'prestige',
				role: 'OWNER',
				status: 'active',
			},
			{
				tenantId: 'ten-004',
				tenantName: 'Cambridge Tashkent',
				subdomain: 'cambridge',
				role: 'ADMIN',
				status: 'active',
			},
		],
	},
];
