/**
 * ft_transcendence - API Client
 * Handles all HTTP requests to the backend
 */

const API_BASE = '/api';

interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
}

interface RequestOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	body?: unknown;
	headers?: Record<string, string>;
}

class ApiClient {
	private baseUrl: string;

	constructor(baseUrl: string = API_BASE) {
		this.baseUrl = baseUrl;
	}

	/**
	 * Make an API request
	 */
	async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
		const { method = 'GET', body, headers = {} } = options;

		// Get auth token from localStorage
		const isFormData = body instanceof FormData;
		const token = localStorage.getItem('auth_token');

		const config: RequestInit = {
			method,
			headers: {
				...(isFormData ? {} : { 'Content-Type': 'application/json' }),
				...(token ? { Authorization: `Bearer ${token}` } : {}),
				...headers,
			},
			credentials: 'include', // Include cookies for session
		};

		if (body && method !== 'GET') {
			config.body = isFormData ? (body as any) : JSON.stringify(body);
		}

		try {
			const response = await fetch(`${this.baseUrl}${endpoint}`, config);
			const data = await response.json();

			if (!response.ok) {
				return {
					success: false,
					error: data.message || data.error || `HTTP ${response.status}`,
				};
			}

			return {
				success: true,
				data,
			};
		} catch (error) {
			return {
				success: false,
				error: error instanceof Error ? error.message : 'Network error',
			};
		}
	}

	// Convenience methods
	get<T>(endpoint: string, headers?: Record<string, string>) {
		return this.request<T>(endpoint, { method: 'GET', headers });
	}

	post<T>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
		return this.request<T>(endpoint, { method: 'POST', body, headers });
	}

	put<T>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
		return this.request<T>(endpoint, { method: 'PUT', body, headers });
	}

	patch<T>(endpoint: string, body?: unknown, headers?: Record<string, string>) {
		return this.request<T>(endpoint, { method: 'PATCH', body, headers });
	}

	delete<T>(endpoint: string, headers?: Record<string, string>) {
		return this.request<T>(endpoint, { method: 'DELETE', headers });
	}
}

// Export singleton instance
export const api = new ApiClient();
export default api;
