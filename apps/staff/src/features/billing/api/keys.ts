export interface FeePlanListFilters {
	page?: number;
	limit?: number;
	branchIds?: number[];
	courseId?: number;
	isActive?: boolean;
}

export const feePlansKeys = {
	all: ['fee-plans'] as const,

	feePlans: () => [...feePlansKeys.all, 'fee-plan'] as const,
	feePlanList: (filters: FeePlanListFilters) =>
		[...feePlansKeys.feePlans(), 'list', filters] as const,
};

export interface DiscountListFilters {
	page?: number;
	limit?: number;
	isActive?: boolean;
	search?: string;
}

export const discountsKeys = {
	all: ['discounts'] as const,

	discounts: () => [...discountsKeys.all, 'discount'] as const,
	discountList: (filters: DiscountListFilters) =>
		[...discountsKeys.discounts(), 'list', filters] as const,
};
