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
        <p class="text-white/60 text-sm mb-4">${t('settings.languageHint') || 'This will be your default language when you log in.'}</p>
        <div class="flex gap-2">
          <select id="settings-language" class="input flex-1">
            ${i18n.getAvailableLanguages().map(lang => `
              <option value="${lang.code}" ${auth.getUser()?.language === lang.code ? 'selected' : ''}>
                ${lang.name}
              </option>
            `).join('')}
          </select>
          <button id="save-language-btn" class="btn btn-primary">${t('common.save')}</button>
        </div>
        <div id="language-success" class="text-green-400 text-sm mt-2 hidden"></div>
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
      
      <!-- Password Change -->
      <div class="card mb-6">
        <h2 class="font-game text-lg text-pong-primary mb-4">${t('settings.changePassword') || 'Change Password'}</h2>
        <p class="text-white/60 text-sm mb-4">${t('settings.passwordHint') || 'Password must be at least 8 characters with uppercase, lowercase, and a number.'}</p>
        <div class="space-y-3">
          <input type="password" id="current-password-input" class="input w-full" placeholder="${t('settings.currentPassword') || 'Current Password'}" />
          <input type="password" id="new-password-input" class="input w-full" placeholder="${t('settings.newPassword') || 'New Password'}" />
          <input type="password" id="confirm-password-input" class="input w-full" placeholder="${t('settings.confirmNewPassword') || 'Confirm New Password'}" />
          <button id="change-password-btn" class="btn btn-primary w-full">${t('common.save') || 'Save'}</button>
        </div>
        <div id="password-error" class="text-red-400 text-sm mt-2 hidden"></div>
        <div id="password-success" class="text-green-400 text-sm mt-2 hidden"></div>
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

  // Language save - only saves to profile when Save button is clicked
  const langSelect = document.getElementById('settings-language') as HTMLSelectElement;
  const saveLangBtn = document.getElementById('save-language-btn') as HTMLButtonElement;
  const langSuccess = document.getElementById('language-success')!;

  saveLangBtn?.addEventListener('click', async (e) => {
    e.preventDefault();
    const newLang = langSelect.value as Language;
    langSuccess.classList.add('hidden');
    langSuccess.textContent = '';
    langSuccess.classList.remove('text-red-400');

    // Save to user profile in backend
    if (auth.isAuthenticated()) {
      saveLangBtn.disabled = true;
      saveLangBtn.textContent = t('common.loading') || 'Saving...';

      try {
        const result = await api.put(`/users/${auth.getUser()!.id}`, { language: newLang });

        if (result.success) {
          auth.updateUserLanguage(newLang);
          i18n.setLanguage(newLang);
        } else {
          saveLangBtn.disabled = false;
          saveLangBtn.textContent = t('common.save') || 'Save';
          console.error('Failed to save language preference:', result.error);
          langSuccess.textContent = t('errors.networkError') || 'Failed to save';
          langSuccess.classList.remove('hidden');
          langSuccess.classList.add('text-red-400');
        }
      } catch (err) {
        saveLangBtn.disabled = false;
        saveLangBtn.textContent = t('common.save') || 'Save';
        console.error('Error saving language:', err);
      }
    }
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

  // Password change
  const currentPasswordInput = document.getElementById('current-password-input') as HTMLInputElement;
  const newPasswordInput = document.getElementById('new-password-input') as HTMLInputElement;
  const confirmPasswordInput = document.getElementById('confirm-password-input') as HTMLInputElement;
  const changePasswordBtn = document.getElementById('change-password-btn') as HTMLButtonElement;
  const passwordError = document.getElementById('password-error')!;
  const passwordSuccess = document.getElementById('password-success')!;

  changePasswordBtn?.addEventListener('click', async () => {
    const currentPassword = currentPasswordInput.value;
    const newPassword = newPasswordInput.value;
    const confirmPassword = confirmPasswordInput.value;

    // Reset messages
    passwordError.classList.add('hidden');
    passwordSuccess.classList.add('hidden');

    // Validate inputs
    if (!currentPassword || !newPassword || !confirmPassword) {
      passwordError.textContent = t('errors.required') || 'All fields are required';
      passwordError.classList.remove('hidden');
      return;
    }

    if (newPassword !== confirmPassword) {
      passwordError.textContent = t('errors.passwordMismatch') || 'Passwords do not match';
      passwordError.classList.remove('hidden');
      return;
    }

    if (newPassword.length < 8) {
      passwordError.textContent = t('errors.minLength', { min: 8 }) || 'Password must be at least 8 characters';
      passwordError.classList.remove('hidden');
      return;
    }

    changePasswordBtn.disabled = true;
    changePasswordBtn.textContent = '...';

    const user = auth.getUser();
    if (!user) {
      router.navigate('/login');
      return;
    }

    const result = await api.put(`/users/${user.id}/password`, { currentPassword, newPassword });

    if (result.success) {
      passwordSuccess.textContent = t('settings.passwordChanged') || 'Password changed successfully!';
      passwordSuccess.classList.remove('hidden');
      currentPasswordInput.value = '';
      newPasswordInput.value = '';
      confirmPasswordInput.value = '';
    } else {
      passwordError.textContent = result.error || 'Failed to change password';
      passwordError.classList.remove('hidden');
    }

    changePasswordBtn.disabled = false;
    changePasswordBtn.textContent = t('common.save') || 'Save';
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
}
