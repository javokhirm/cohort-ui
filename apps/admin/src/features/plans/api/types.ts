export interface PlanView {
	id: number;
	name: string;
	features: Record<string, unknown>;
	priceMonthly: number;
	priceAnnual: number;
	maxStudents: number | null;
	maxBranches: number | null;
	isActive: boolean;
	createdAt: string;
	updatedAt: string;
}

export interface CreatePlanInput {
	name: string;
	priceMonthly: number;
	priceAnnual: number;
	maxStudents?: number | null;
	maxBranches?: number | null;
	features?: Record<string, unknown>;
	isActive?: boolean;
}

export interface UpdatePlanInput {
	name?: string;
	priceMonthly?: number;
	priceAnnual?: number;
	maxStudents?: number | null;
	maxBranches?: number | null;
	features?: Record<string, unknown>;
	isActive?: boolean;
}

export interface PlanListFilters {
	isActive?: boolean;
	page?: number;
	limit?: number;
}
