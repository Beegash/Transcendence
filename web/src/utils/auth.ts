/**
 * Auth State Management
 * Handles user authentication state and token storage
 */

import { api } from './api';
import { router } from './router';
import { presenceSocket } from './presenceSocket';

export interface User {
	id: number;
	email: string;
	username: string;
	displayName: string;
	avatarUrl?: string;
	isOnline?: boolean;
	language?: string;
	stats?: {
		totalGames: number;
		wins: number;
		losses: number;
		tournamentsWon: number;
	};
}

interface AuthState {
	user: User | null;
	token: string | null;
	isAuthenticated: boolean;
}

class AuthStore {
	private state: AuthState = {
		user: null,
		token: null,
		isAuthenticated: false,
	};

	private listeners: Set<() => void> = new Set();

	constructor() {
		// Load from localStorage on init
		this.loadFromStorage();
	}

	/**
	 * Load auth state from localStorage
	 */
	private loadFromStorage(): void {
		try {
			const token = localStorage.getItem('auth_token');
			const userJson = localStorage.getItem('auth_user');

			if (token && userJson) {
				this.state.token = token;
				this.state.user = JSON.parse(userJson);
				this.state.isAuthenticated = true;
			}
		} catch (error) {
			console.error('Failed to load auth state:', error);
			this.clearStorage();
		}
	}

	/**
	 * Save auth state to localStorage
	 */
	private saveToStorage(): void {
		if (this.state.token && this.state.user) {
			localStorage.setItem('auth_token', this.state.token);
			localStorage.setItem('auth_user', JSON.stringify(this.state.user));
		}
	}

	/**
	 * Clear localStorage
	 */
	private clearStorage(): void {
		localStorage.removeItem('auth_token');
		localStorage.removeItem('auth_user');
	}

	/**
	 * Register a new user
	 */
	async register(username: string, email: string, password: string): Promise<{ success: boolean; error?: string }> {
		const result = await api.post<{ message: string; userId: number }>('/auth/register', {
			username,
			email,
			password,
		});

		if (result.success) {
			return { success: true };
		}

		return { success: false, error: result.error };
	}

	/**
	 * Login user
	 */
	async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
		const result = await api.post<{ user: User; token: string }>('/auth/login', {
			email,
			password,
		});

		if (result.success && result.data) {
			this.state.user = result.data.user;
			this.state.token = result.data.token;
			this.state.isAuthenticated = true;
			this.saveToStorage();
			this.notifyListeners();

			// Connect to presence socket for online status tracking
			this.connectPresence();

			return { success: true };
		}

		return { success: false, error: result.error };
	}

	/**
	 * Logout user
	 */
	async logout(): Promise<void> {
		// Disconnect presence socket first (sends logout message)
		presenceSocket.disconnect(true);

		// Call logout API (optional, for server-side cleanup)
		if (this.state.token) {
			await api.post('/auth/logout');
		}

		// Clear state
		this.state.user = null;
		this.state.token = null;
		this.state.isAuthenticated = false;
		this.clearStorage();
		this.notifyListeners();

		// Redirect to home
		router.navigate('/');
	}

	/**
	 * Fetch current user from API
	 */
	async fetchCurrentUser(): Promise<boolean> {
		if (!this.state.token) return false;

		const result = await api.get<User>('/auth/me');

		if (result.success && result.data) {
			this.state.user = result.data;
			this.saveToStorage();
			this.notifyListeners();
			return true;
		}

		// Token invalid, clear auth state silently (don't redirect)
		this.state.user = null;
		this.state.token = null;
		this.state.isAuthenticated = false;
		this.clearStorage();
		this.notifyListeners();
		return false;
	}

	/**
	 * Get current user
	 */
	getUser(): User | null {
		return this.state.user;
	}

	/**
	 * Get auth token
	 */
	getToken(): string | null {
		return this.state.token;
	}

	/**
	 * Check if user is authenticated
	 */
	isAuthenticated(): boolean {
		return this.state.isAuthenticated;
	}

	/**
	 * Subscribe to auth state changes
	 */
	subscribe(listener: () => void): () => void {
		this.listeners.add(listener);
		return () => this.listeners.delete(listener);
	}

	private notifyListeners(): void {
		this.listeners.forEach((listener) => listener());
	}

	/**
	 * Connect to presence WebSocket for online status tracking
	 */
	private connectPresence(): void {
		if (this.state.token) {
			presenceSocket.connect(this.state.token).catch((err) => {
				console.error('[Auth] Failed to connect presence socket:', err);
			});
		}
	}

	/**
	 * Initialize presence connection if already authenticated
	 * Should be called once on app startup
	 */
	initPresence(): void {
		if (this.state.isAuthenticated && this.state.token) {
			this.connectPresence();
		}
	}
}

// Export singleton
export const auth = new AuthStore();
export default auth;
