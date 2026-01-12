/**
 * 404 Not Found Page
 */

import { t } from '../i18n';
import { renderNavbar } from '../components/navbar';

export function renderNotFoundPage(): void {
	renderNavbar();

	const app = document.getElementById('app');
	if (!app) return;

	let content = document.getElementById('page-content');
	if (!content) {
		content = document.createElement('div');
		content.id = 'page-content';
		app.appendChild(content);
	}

	content.innerHTML = `
    <div class="min-h-[80vh] flex items-center justify-center px-4">
      <div class="text-center">
        <div class="font-game text-8xl text-pong-primary mb-4 glow-text">404</div>
        <h1 class="text-2xl text-gray-300 mb-4">${t('errors.notFound')}</h1>
        <p class="text-gray-500 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <a href="/" data-link class="btn btn-primary">
          ← Back to Home
        </a>
      </div>
    </div>
  `;
}
