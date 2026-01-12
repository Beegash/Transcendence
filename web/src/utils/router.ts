/**
 * ft_transcendence - SPA Router
 * Handles client-side routing with browser history support
 */

export type RouteHandler = () => void | Promise<void>;

interface Route {
	path: string;
	handler: RouteHandler;
	title?: string;
}

class Router {
	private routes: Map<string, Route> = new Map();
	private notFoundHandler: RouteHandler | null = null;

	constructor() {
		// Handle browser back/forward buttons
		window.addEventListener('popstate', () => this.handleRoute());

		// Handle link clicks
		document.addEventListener('click', (e) => {
			const target = e.target as HTMLElement;
			const link = target.closest('a[data-link]');

			if (link) {
				e.preventDefault();
				const href = link.getAttribute('href');
				if (href) {
					this.navigate(href);
				}
			}
		});
	}

	/**
	 * Register a route
	 */
	addRoute(path: string, handler: RouteHandler, title?: string): Router {
		this.routes.set(path, { path, handler, title });
		return this;
	}

	/**
	 * Set 404 handler
	 */
	setNotFound(handler: RouteHandler): Router {
		this.notFoundHandler = handler;
		return this;
	}

	/**
	 * Navigate to a path
	 */
	navigate(path: string): void {
		window.history.pushState({}, '', path);
		this.handleRoute();
	}

	/**
	 * Replace current path without adding to history
	 */
	replace(path: string): void {
		window.history.replaceState({}, '', path);
		this.handleRoute();
	}

	/**
	 * Handle the current route
	 */
	async handleRoute(): Promise<void> {
		const path = window.location.pathname;
		const route = this.routes.get(path);

		if (route) {
			// Update page title
			if (route.title) {
				document.title = `${route.title} | ft_transcendence`;
			}
			await route.handler();
		} else {
			// Try to match dynamic routes (e.g., /user/:id)
			const matchedRoute = this.matchDynamicRoute(path);

			if (matchedRoute) {
				await matchedRoute.handler();
			} else if (this.notFoundHandler) {
				document.title = '404 Not Found | ft_transcendence';
				await this.notFoundHandler();
			}
		}
	}

	/**
	 * Match dynamic routes with parameters
	 */
	private matchDynamicRoute(path: string): Route | null {
		for (const [routePath, route] of this.routes) {
			if (routePath.includes(':')) {
				const routeParts = routePath.split('/');
				const pathParts = path.split('/');

				if (routeParts.length === pathParts.length) {
					const matches = routeParts.every((part, index) => {
						return part.startsWith(':') || part === pathParts[index];
					});

					if (matches) {
						return route;
					}
				}
			}
		}
		return null;
	}

	/**
	 * Get route parameters from current path
	 */
	getParams(routePattern: string): Record<string, string> {
		const path = window.location.pathname;
		const routeParts = routePattern.split('/');
		const pathParts = path.split('/');
		const params: Record<string, string> = {};

		routeParts.forEach((part, index) => {
			if (part.startsWith(':')) {
				const paramName = part.slice(1);
				params[paramName] = pathParts[index];
			}
		});

		return params;
	}

	/**
	 * Get query parameters
	 */
	getQuery(): URLSearchParams {
		return new URLSearchParams(window.location.search);
	}

	/**
	 * Initialize router and handle initial route
	 */
	init(): void {
		this.handleRoute();
	}
}

// Export singleton instance
export const router = new Router();
export default router;
