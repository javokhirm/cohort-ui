import { superAdminApi } from '@/api/apiClient';
import type { DashboardKpis } from './types';

export function getDashboard(): Promise<DashboardKpis> {
	return superAdminApi.get<DashboardKpis>('/dashboard');
}
