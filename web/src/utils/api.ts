// ft_transcendence - API Client
// Handles all HTTP requests to the backend

const API_BASE = '/api';

interface ApiResponse<T> {
	success: boolean;
	data?: T;
	error?: string;
	statusCode?: number;
}

interface RequestOptions {
	method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
	body?: unknown;
	headers?: Record<string, string>;
	silent?: boolean;
}

class ApiClient {
	private baseUrl: string;

	constructor(baseUrl: string = API_BASE) {
		this.baseUrl = baseUrl;
	}

	// Make an API request
	// Note: 400/401 errors are EXPECTED for validation failures and auth errors.
	// These are not bugs - they indicate the API is working correctly.
	// The error message will be returned in the ApiResponse for the UI to display.

	async request<T>(endpoint: string, options: RequestOptions = {}): Promise<ApiResponse<T>> {
		const { method = 'GET', body, headers = {}, silent = false } = options;

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

			// Check if response is JSON
			const contentType = response.headers.get('content-type');
			const isJson = contentType?.includes('application/json');

			let data: any;
			if (isJson) {
				data = await response.json();
			} else {
				// If not JSON, read as text (might be HTML error page)
				const text = await response.text();

				// Check if it's an HTML response (common with nginx/server errors for large files)
				const isHtml = text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html');

				if (isHtml) {
					// Return a clean error message instead of HTML
					if (response.status === 413) {
						return {
							success: false,
							error: 'errors.fileTooLarge', // Will be translated by the UI
							statusCode: 413,
						};
					}
					return {
						success: false,
						error: `Server error (${response.status}). Please try again.`,
						statusCode: response.status,
					};
				}

				return {
					success: false,
					error: `Server returned non-JSON response (${response.status}): ${text.substring(0, 100)}`,
					statusCode: response.status,
				};
			}

			if (!response.ok) {
				const errorMessage = data.error || data.message || `HTTP ${response.status}`;
				
				// Only log unexpected errors (500+) to console
				// 400/401/403/404/409 are expected validation/auth errors - not bugs
				if (!silent && response.status >= 500) {
					console.error(`[API Error] ${method} ${endpoint}: ${response.status} - ${errorMessage}`);
				}

				// Special handling for file size errors
				if (response.status === 413) {
					return {
						success: false,
						error: data.error || 'File size too large. Maximum file size is 5MB. Please compress or resize your image.',
						statusCode: 413,
					};
				}
				
				return {
					success: false,
					error: errorMessage,
					statusCode: response.status,
				};
			}

			return {
				success: true,
				data,
				statusCode: response.status,
			};
		} catch (error) {
			// Network errors are always logged
			console.error(`[API Network Error] ${method} ${endpoint}:`, error);
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
