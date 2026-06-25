export interface PaginatedResult<T> {
	rows: T[];
	page: number;
	limit: number;
	total: number;
	totalPages: number;
}

export interface PaginationParams {
	page?: number;
	limit?: number;
}

export function paginationToParams(params: PaginationParams): Record<string, string> {
	const result: Record<string, string> = {};
	if (params.page != null) result['page'] = String(params.page);
	if (params.limit != null) result['limit'] = String(params.limit);
	return result;
}
