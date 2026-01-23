/**
 * Settings Page
 */

import { t, i18n, Language } from '../i18n';
import { renderNavbar } from '../components/navbar';
import api from '../utils/api';
import { auth } from '../utils/auth';
import { router } from '../utils/router';

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
      
      <!-- Username Change -->
      <div class="card mb-6">
        <h2 class="font-game text-lg text-pong-primary mb-4">${t('settings.changeUsername') || 'Change Username'}</h2>
        <p class="text-white/60 text-sm mb-4">${t('settings.usernameHint') || 'Username must be 3-20 characters, letters, numbers, and underscores only.'}</p>
        <div class="flex gap-2">
          <input type="text" id="new-username-input" class="input flex-1" placeholder="${auth.getUser()?.username || ''}" maxlength="20" />
          <button id="change-username-btn" class="btn btn-primary">${t('common.save') || 'Save'}</button>
        </div>
        <div id="username-error" class="text-red-400 text-sm mt-2 hidden"></div>
        <div id="username-success" class="text-green-400 text-sm mt-2 hidden"></div>
      </div>
      
    
      <!-- Privacy (GDPR) -->
      <div class="card mb-6">
        <h2 class="font-game text-lg text-pong-primary mb-4">${t('settings.privacy')}</h2>
        <div class="space-y-4">
          <button id="export-data-btn" class="btn btn-secondary w-full flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
            </svg>
            ${t('settings.exportData')}
          </button>
          <button id="anonymize-btn" class="btn btn-secondary w-full flex items-center justify-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            ${t('settings.anonymize')}
          </button>
        </div>
      </div>
      
      <!-- Danger Zone -->
      <div class="card border-red-500/30">
        <h2 class="font-game text-lg text-red-400 mb-4">${t('settings.dangerZone')}</h2>
        <p class="text-white/60 text-sm mb-4">
          ${t('settings.dangerZoneWarning')}
        </p>
        <button id="delete-account-btn" class="btn btn-danger w-full">
          ${t('settings.deleteAccount')}
        </button>
      </div>
      
      <!-- Delete Confirmation Modal -->
      <div id="delete-modal" class="hidden fixed inset-0 z-50 flex items-center justify-center bg-black/80">
        <div class="card max-w-md mx-4">
          <h3 class="font-game text-xl text-red-400 mb-4">Confirm Account Deletion</h3>
          <p class="text-white/80 mb-6">
            This action cannot be undone. All your data, including match history, stats, and friends list will be permanently deleted.
          </p>
          <p class="text-white/80 mb-6">
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

  // Username change
  const usernameInput = document.getElementById('new-username-input') as HTMLInputElement;
  const changeUsernameBtn = document.getElementById('change-username-btn') as HTMLButtonElement;
  const usernameError = document.getElementById('username-error')!;
  const usernameSuccess = document.getElementById('username-success')!;

  changeUsernameBtn?.addEventListener('click', async () => {
    const newUsername = usernameInput.value.trim();

    // Reset messages
    usernameError.classList.add('hidden');
    usernameSuccess.classList.add('hidden');

    // Validate input
    if (!newUsername) {
      usernameError.textContent = t('settings.usernameRequired') || 'Please enter a username';
      usernameError.classList.remove('hidden');
      return;
    }

    if (newUsername.length < 3 || newUsername.length > 20) {
      usernameError.textContent = t('settings.usernameLengthError') || 'Username must be 3-20 characters';
      usernameError.classList.remove('hidden');
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) {
      usernameError.textContent = t('settings.usernameFormatError') || 'Only letters, numbers, and underscores allowed';
      usernameError.classList.remove('hidden');
      return;
    }

    changeUsernameBtn.disabled = true;
    changeUsernameBtn.textContent = '...';

    const user = auth.getUser();
    if (!user) {
      router.navigate('/login');
      return;
    }

    const result = await api.put(`/users/${user.id}`, { username: newUsername });

    if (result.success) {
      usernameSuccess.textContent = t('settings.usernameChanged') || 'Username changed successfully!';
      usernameSuccess.classList.remove('hidden');
      usernameInput.value = '';
      usernameInput.placeholder = newUsername.toLowerCase();

      // Refresh user data
      await auth.fetchCurrentUser();
    } else {
      usernameError.textContent = result.error || 'Failed to change username';
      usernameError.classList.remove('hidden');
    }

    changeUsernameBtn.disabled = false;
    changeUsernameBtn.textContent = t('common.save') || 'Save';
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
    confirmDeleteBtn.disabled = true;
    confirmDeleteBtn.textContent = 'Deleting...';

    const result = await api.delete('/auth/account');

    if (result.success) {
      await auth.logout();
      alert('Account deleted successfully');
      router.navigate('/');
    } else {
      alert(result.error || 'Failed to delete account');
      confirmDeleteBtn.disabled = false;
      confirmDeleteBtn.textContent = 'Delete';
    }
    deleteModal?.classList.add('hidden');
  });

  // Export Data button
  document.getElementById('export-data-btn')?.addEventListener('click', async () => {
    const btn = document.getElementById('export-data-btn') as HTMLButtonElement;
    btn.disabled = true;
    btn.textContent = 'Exporting...';

    try {
      const response = await fetch('/api/auth/export-data', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'pong_data.json';
        a.click();
        URL.revokeObjectURL(url);
      } else {
        alert('Failed to export data');
      }
    } catch {
      alert('Failed to export data');
    }

    btn.disabled = false;
    btn.innerHTML = `<svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg> ${t('settings.exportData')}`;
  });

  // Anonymize button
  document.getElementById('anonymize-btn')?.addEventListener('click', async () => {
    if (!confirm('Are you sure you want to anonymize your account? This will remove your personal data but keep your game history.')) {
      return;
    }

    const result = await api.post('/auth/anonymize', {});

    if (result.success) {
      await auth.logout();
      alert('Account anonymized successfully');
      router.navigate('/');
    } else {
      alert(result.error || 'Failed to anonymize account');
    }
  });
}
