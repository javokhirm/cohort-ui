import axios, {
	type AxiosInstance,
	type AxiosRequestConfig,
	type InternalAxiosRequestConfig,
} from 'axios';
import { ApiError } from './errors';
import type { PaginatedResult } from './pagination';

interface EnvelopeMeta {
	timestamp: string;
	page?: number;
	limit?: number;
	total?: number;
	totalPages?: number;
}

interface SuccessEnvelope<T> {
	success: true;
	data: T;
	meta: EnvelopeMeta;
}

interface ErrorEnvelope {
	success: false;
	error: {
		code: string;
		message: string;
		details?: Record<string, unknown>;
	};
	meta: EnvelopeMeta;
}

type ApiEnvelope<T> = SuccessEnvelope<T> | ErrorEnvelope;

interface RetriableConfig extends InternalAxiosRequestConfig {
	_retry?: boolean;
}

export interface ApiClientOptions {
	baseUrl: string;
	/** Injected by auth — never import auth inside this package. */
	getAccessToken: () => string | null;
	/** Injected by auth. Return true when a new token is ready and the caller should retry. */
	onUnauthorized: () => Promise<boolean>;
	/**
	 * Injected by the app's i18n layer — return the active locale code
	 * (`'uz' | 'ru' | 'en'`). Sent as the `x-lang` header so the backend
	 * localises `error.message` and other request-scoped text. Injected exactly
	 * like `getAccessToken` so this package never imports `@repo/i18n`.
	 */
	getLocale?: () => string;
}

export function createApiClient(opts: ApiClientOptions): ApiClient {
	// `indexes: null` serializes array params as repeated keys (`branchIds=1&branchIds=2`)
	// instead of axios' bracketed default (`branchIds[]=1`), which the backend's query
	// parser would read as a differently-named key.
	const http = axios.create({
		baseURL: opts.baseUrl,
		paramsSerializer: { indexes: null },
	});

	http.interceptors.request.use((config) => {
		const token = opts.getAccessToken();
		if (token) config.headers.Authorization = `Bearer ${token}`;
		const locale = opts.getLocale?.();
		if (locale) config.headers['x-lang'] = locale;
		return config;
	});

	// Single-flight refresh: concurrent 401s share one refresh promise.
	let refreshPromise: Promise<boolean> | null = null;

	http.interceptors.response.use(
		(res) => res,
		async (error: unknown) => {
			if (!axios.isAxiosError(error)) throw error;

			const status = error.response?.status;
			const config = error.config as RetriableConfig | undefined;

			if (status === 401 && config && !config._retry) {
				config._retry = true;
				if (!refreshPromise) {
					refreshPromise = opts.onUnauthorized().finally(() => {
						refreshPromise = null;
					});
				}
				const refreshed = await refreshPromise;
				if (refreshed) {
					const token = opts.getAccessToken();
					if (token) config.headers.Authorization = `Bearer ${token}`;
					return http(config);
				}
			}

			const body = error.response?.data as ApiEnvelope<unknown> | undefined;
			if (body && !body.success && body.error) {
				throw new ApiError(
					body.error.code,
					body.error.message,
					status ?? 0,
					body.error.details,
				);
			}

			throw new ApiError('UNKNOWN_ERROR', error.message, status ?? 0);
		},
	);

	return new ApiClient(http);
}

export class ApiClient {
	constructor(private readonly http: AxiosInstance) {}

	async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
		const res = await this.http.get<ApiEnvelope<T>>(url, config);
		return unwrap(res.data);
	}

	async getPaginated<T>(
		url: string,
		config?: AxiosRequestConfig,
	): Promise<PaginatedResult<T>> {
		const res = await this.http.get<ApiEnvelope<T[]>>(url, config);
		return unwrapPaginated(res.data);
	}

	async post<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
		const res = await this.http.post<ApiEnvelope<T>>(url, body, config);
		return unwrap(res.data);
	}

	async patch<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
		const res = await this.http.patch<ApiEnvelope<T>>(url, body, config);
		return unwrap(res.data);
	}

	async put<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
		const res = await this.http.put<ApiEnvelope<T>>(url, body, config);
		return unwrap(res.data);
	}

	/** DELETE always returns null — the backend sends 204 No Content. */
	async delete(url: string, config?: AxiosRequestConfig): Promise<null> {
		await this.http.delete(url, config);
		return null;
	}
}

function unwrap<T>(envelope: ApiEnvelope<T>): T {
	if (!envelope.success) {
		throw new ApiError(
			envelope.error.code,
			envelope.error.message,
			0,
			envelope.error.details,
		);
	}
	return envelope.data;
}

function unwrapPaginated<T>(envelope: ApiEnvelope<T[]>): PaginatedResult<T> {
	const rows = unwrap(envelope);
	const { page, limit, total, totalPages } = envelope.meta;
	return {
		rows,
		page: page ?? 1,
		limit: limit ?? 20,
		total: total ?? 0,
		totalPages: totalPages ?? 0,
	};
}
