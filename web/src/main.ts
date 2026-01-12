/**
 * ft_transcendence - Main Application Entry Point
 */

import './styles/main.css';
import { router } from './utils/router';
import { i18n } from './i18n';
import { auth } from './utils/auth';
import { renderHomePage } from './pages/home';
import { renderLoginPage } from './pages/login';
import { renderRegisterPage } from './pages/register';
import { renderGamePage } from './pages/game';
import { renderProfilePage } from './pages/profile';
import { renderTournamentPage } from './pages/tournament';
import { renderSettingsPage } from './pages/settings';
import { renderNotFoundPage } from './pages/404';
import { renderNavbar } from './components/navbar';

// Protected route wrapper
function requireAuth(handler: () => void | Promise<void>): () => void | Promise<void> {
	return () => {
		if (!auth.isAuthenticated()) {
			router.navigate('/login');
			return;
		}
		return handler();
	};
}

// Guest only route wrapper (redirect to home if logged in)
function guestOnly(handler: () => void | Promise<void>): () => void | Promise<void> {
	return () => {
		if (auth.isAuthenticated()) {
			router.navigate('/');
			return;
		}
		return handler();
	};
}

// Initialize the application
function init(): void {
	console.log('🏓 ft_transcendence initializing...');

	// Set up routes
	router
		.addRoute('/', renderHomePage, 'Home')
		.addRoute('/login', guestOnly(renderLoginPage), 'Login')
		.addRoute('/register', guestOnly(renderRegisterPage), 'Register')
		.addRoute('/game', renderGamePage, 'Play')
		.addRoute('/profile', requireAuth(renderProfilePage), 'Profile')
		.addRoute('/profile/:id', renderProfilePage, 'Profile')
		.addRoute('/tournament', renderTournamentPage, 'Tournament')
		.addRoute('/settings', requireAuth(renderSettingsPage), 'Settings')
		.setNotFound(renderNotFoundPage);

	// Subscribe to language changes
	i18n.subscribe(() => {
		router.handleRoute();
	});

	// Subscribe to auth changes
	auth.subscribe(() => {
		renderNavbar();
	});

	// Initial render
	renderNavbar();
	router.init();

	console.log('✅ ft_transcendence ready!');
}

// Start the app when DOM is ready
if (document.readyState === 'loading') {
	document.addEventListener('DOMContentLoaded', init);
} else {
	init();
}
