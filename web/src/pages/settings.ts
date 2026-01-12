/**
 * Settings Page
 */

import { t, i18n, Language } from '../i18n';
import { renderNavbar } from '../components/navbar';

export function renderSettingsPage(): void {
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
    <div class="max-w-2xl mx-auto px-4 py-8">
      <h1 class="font-game text-3xl text-center text-gradient mb-8">${t('settings.title')}</h1>
      
      <!-- Language Settings -->
      <div class="card mb-6">
        <h2 class="font-game text-lg text-pong-primary mb-4">${t('settings.language')}</h2>
        <select id="settings-language" class="input">
          ${i18n.getAvailableLanguages().map(lang => `
            <option value="${lang.code}" ${i18n.getLanguage() === lang.code ? 'selected' : ''}>
              ${lang.name}
            </option>
          `).join('')}
        </select>
      </div>
      
      <!-- Notifications -->
      <div class="card mb-6">
        <h2 class="font-game text-lg text-pong-primary mb-4">${t('settings.notifications')}</h2>
        <div class="space-y-4">
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-gray-300">Game invitations</span>
            <input type="checkbox" checked class="w-5 h-5 rounded bg-pong-dark border-pong-light text-pong-primary focus:ring-pong-primary">
          </label>
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-gray-300">Tournament updates</span>
            <input type="checkbox" checked class="w-5 h-5 rounded bg-pong-dark border-pong-light text-pong-primary focus:ring-pong-primary">
          </label>
          <label class="flex items-center justify-between cursor-pointer">
            <span class="text-gray-300">Friend requests</span>
            <input type="checkbox" checked class="w-5 h-5 rounded bg-pong-dark border-pong-light text-pong-primary focus:ring-pong-primary">
          </label>
        </div>
      </div>
      
      <!-- Privacy (GDPR) -->
      <div class="card mb-6">
        <h2 class="font-game text-lg text-pong-primary mb-4">${t('settings.privacy')}</h2>
        <div class="space-y-4">
          <button class="btn btn-secondary w-full flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            ${t('settings.exportData')}
          </button>
          <button class="btn btn-secondary w-full flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            ${t('settings.anonymize')}
          </button>
        </div>
      </div>
      
      <!-- Danger Zone -->
      <div class="card border-red-500/30">
        <h2 class="font-game text-lg text-red-400 mb-4">Danger Zone</h2>
        <p class="text-gray-500 text-sm mb-4">
          Once you delete your account, there is no going back. Please be certain.
        </p>
        <button id="delete-account-btn" class="btn btn-danger w-full">
          ${t('settings.deleteAccount')}
        </button>
      </div>
      
      <!-- Delete Confirmation Modal -->
      <div id="delete-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div class="card max-w-md mx-4">
          <h3 class="font-game text-xl text-red-400 mb-4">Confirm Account Deletion</h3>
          <p class="text-gray-400 mb-6">
            This action cannot be undone. All your data, including match history, stats, and friends list will be permanently deleted.
          </p>
          <p class="text-gray-400 mb-6">
            Type <strong class="text-white">DELETE</strong> to confirm:
          </p>
          <input type="text" id="delete-confirm-input" class="input mb-4" placeholder="Type DELETE">
          <div class="flex gap-4">
            <button id="cancel-delete-btn" class="btn btn-secondary flex-1">${t('common.cancel')}</button>
            <button id="confirm-delete-btn" class="btn btn-danger flex-1" disabled>${t('common.delete')}</button>
          </div>
        </div>
      </div>
    </div>
  `;

	// Language change
	const langSelect = document.getElementById('settings-language') as HTMLSelectElement;
	langSelect?.addEventListener('change', (e) => {
		const target = e.target as HTMLSelectElement;
		i18n.setLanguage(target.value as Language);
	});

	// Delete account modal
	const deleteBtn = document.getElementById('delete-account-btn');
	const deleteModal = document.getElementById('delete-modal');
	const cancelDeleteBtn = document.getElementById('cancel-delete-btn');
	const confirmDeleteBtn = document.getElementById('confirm-delete-btn') as HTMLButtonElement;
	const deleteConfirmInput = document.getElementById('delete-confirm-input') as HTMLInputElement;

	deleteBtn?.addEventListener('click', () => {
		deleteModal?.classList.remove('hidden');
	});

	cancelDeleteBtn?.addEventListener('click', () => {
		deleteModal?.classList.add('hidden');
		if (deleteConfirmInput) deleteConfirmInput.value = '';
	});

	deleteConfirmInput?.addEventListener('input', (e) => {
		const target = e.target as HTMLInputElement;
		if (confirmDeleteBtn) {
			confirmDeleteBtn.disabled = target.value !== 'DELETE';
		}
	});

	confirmDeleteBtn?.addEventListener('click', async () => {
		// TODO: Call API to delete account
		console.log('Account deletion confirmed');
		deleteModal?.classList.add('hidden');
	});
}
