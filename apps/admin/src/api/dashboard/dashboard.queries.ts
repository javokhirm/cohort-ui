import { adminApi } from '@/api/apiClient';
import type { DashboardKpis } from './types';

export function getDashboard(): Promise<DashboardKpis> {
	return adminApi.get<DashboardKpis>('/dashboard');
}
