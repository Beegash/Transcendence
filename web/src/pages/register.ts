/**
 * Register Page
 */

import { t } from '../i18n';
import { renderNavbar } from '../components/navbar';
import { auth } from '../utils/auth';
import { router } from '../utils/router';

export function renderRegisterPage(): void {
  // Redirect if already logged in
  if (auth.isAuthenticated()) {
    router.navigate('/');
    return;
  }

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
      <div class="w-full max-w-md">
        <div class="card">
          <h1 class="font-game text-3xl text-center text-gradient mb-8">${t('auth.register')}</h1>
          
          <form id="register-form" class="space-y-6">
            <div>
              <label class="block text-sm text-white/80 mb-2">${t('auth.username')}</label>
              <input type="text" name="username" class="input" placeholder="coolplayer42" required minlength="3" maxlength="20">
            </div>
            
            <div>
              <label class="block text-sm text-white/80 mb-2">${t('auth.email')}</label>
              <input type="email" name="email" class="input" placeholder="your@email.com" required>
            </div>
            
            <div>
              <label class="block text-sm text-white/80 mb-2">${t('auth.password')}</label>
              <input type="password" name="password" class="input" placeholder="••••••••" required minlength="8">
              <p class="text-xs text-white/60 mt-1">Min 8 chars, 1 uppercase, 1 lowercase, 1 number</p>
            </div>
            
            <div>
              <label class="block text-sm text-white/80 mb-2">${t('auth.confirmPassword')}</label>
              <input type="password" name="confirmPassword" class="input" placeholder="••••••••" required>
            </div>
            
            <div id="register-error" class="hidden bg-red-500/10 text-red-400 px-4 py-3 rounded-lg text-sm"></div>
            <div id="register-success" class="hidden bg-green-500/10 text-green-400 px-4 py-3 rounded-lg text-sm"></div>
            
            <button type="submit" id="register-btn" class="btn btn-primary w-full">
              ${t('auth.register')}
            </button>
          </form>
          
          <p class="mt-8 text-center text-white/60">
            ${t('auth.hasAccount')} 
            <a href="/login" data-link class="text-pong-primary hover:underline">${t('auth.login')}</a>
          </p>
          
          <footer class="mt-8 pt-6 border-t border-pong-light text-center text-white/40 text-sm">
            ${t('common.madeBy')} <span class="text-pong-primary">iozmen</span>, <span class="text-pong-primary">darikan</span> & <span class="text-pong-primary">rcan</span>
          </footer>
        </div>
      </div>
    </div>

  `;

  // Form submission
  const form = document.getElementById('register-form') as HTMLFormElement;
  const registerBtn = document.getElementById('register-btn') as HTMLButtonElement;
  const errorDiv = document.getElementById('register-error') as HTMLDivElement;
  const successDiv = document.getElementById('register-success') as HTMLDivElement;

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;

    // Hide previous messages
    errorDiv.classList.add('hidden');
    successDiv.classList.add('hidden');

    // Validate passwords match
    if (password !== confirmPassword) {
      errorDiv.textContent = t('errors.passwordMismatch');
      errorDiv.classList.remove('hidden');
      return;
    }

    // Disable button and show loading
    registerBtn.disabled = true;
    registerBtn.textContent = t('common.loading');

    const result = await auth.register(username, email, password);

    if (result.success) {
      // Show success message and redirect to login
      successDiv.textContent = 'Account created! Redirecting to login...';
      successDiv.classList.remove('hidden');

      setTimeout(() => {
        router.navigate('/login');
      }, 1500);
    } else {
      // Show error
      errorDiv.textContent = result.error || 'Registration failed';
      errorDiv.classList.remove('hidden');
      registerBtn.disabled = false;
      registerBtn.textContent = t('auth.register');
    }
  });
}
