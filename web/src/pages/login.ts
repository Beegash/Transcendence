// Login Page

import { t } from '../i18n';
import { renderNavbar } from '../components/navbar';
import { auth } from '../utils/auth';
import { router } from '../utils/router';

export function renderLoginPage(): void {
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
          <h1 class="font-game text-3xl text-center text-gradient mb-8">${t('auth.login')}</h1>
          
          <form id="login-form" class="space-y-6">
            <div>
              <label class="block text-sm text-white/80 mb-2">${t('auth.email')}</label>
              <input type="email" name="email" class="input" placeholder="your@email.com" required>
            </div>
            
            <div>
              <label class="block text-sm text-white/80 mb-2">${t('auth.password')}</label>
              <input type="password" name="password" class="input" placeholder="••••••••" required>
            </div>
            
            <div id="login-error" class="hidden bg-red-500/10 text-red-400 px-4 py-3 rounded-lg text-sm"></div>
            
            <button type="submit" id="login-btn" class="btn btn-primary w-full">
              ${t('auth.login')}
            </button>
          </form>
          
          <p class="mt-8 text-center text-white/60">
            ${t('auth.noAccount')} 
            <a href="/register" data-link class="text-pong-primary hover:underline">${t('auth.register')}</a>
          </p>
          
          <footer class="mt-8 pt-6 border-t border-pong-light text-center text-white/40 text-sm">
            ${t('common.madeBy')} <span class="text-pong-primary">iozmen</span>, <span class="text-pong-primary">darikan</span> & <span class="text-pong-primary">rcan</span>
          </footer>
        </div>
      </div>
    </div>

  `;

  // Form submission
  const form = document.getElementById('login-form') as HTMLFormElement;
  const loginBtn = document.getElementById('login-btn') as HTMLButtonElement;
  const errorDiv = document.getElementById('login-error') as HTMLDivElement;

  form?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const formData = new FormData(form);
    const email = formData.get('email') as string;
  
    const password = formData.get('password') as string;

    // Disable button and show loading
    loginBtn.disabled = true;
    loginBtn.textContent = t('common.loading');
    errorDiv.classList.add('hidden');

    const result = await auth.login(email, password);

    if (result.success) { 
      // Redirect to home page
      router.navigate('/');
      renderNavbar(); // Update navbar to show user menu
    } else {
      // Show error
      errorDiv.textContent = result.error || 'Login failed';
      errorDiv.classList.remove('hidden');  
      loginBtn.disabled = false;
      loginBtn.textContent = t('auth.login');
    }
  });
}
