/**
 * Profile Page
 */

import { t } from '../i18n';
import { renderNavbar } from '../components/navbar';
import { auth, User } from '../utils/auth';
import { router } from '../utils/router';
import { api } from '../utils/api';

export async function renderProfilePage(): Promise<void> {
  renderNavbar();

  const app = document.getElementById('app');
  if (!app) return;

  let content = document.getElementById('page-content');
  if (!content) {
    content = document.createElement('div');
    content.id = 'page-content';
    app.appendChild(content);
  }

  // Check if viewing own profile or another user's
  const params = router.getParams('/profile/:id');
  const profileId = params.id;

  let user: User | null = null;
  let isOwnProfile = false;

  if (profileId) {
    // Viewing another user's profile
    const result = await api.get<User>(`/users/${profileId}`);
    if (result.success && result.data) {
      user = result.data;
      isOwnProfile = auth.getUser()?.id === user.id;
    }
  } else {
    // Viewing own profile
    if (!auth.isAuthenticated()) {
      router.navigate('/login');
      return;
    }
    user = auth.getUser();
    isOwnProfile = true;

    // Refresh user data from API
    await auth.fetchCurrentUser();
    user = auth.getUser();
  }

  if (!user) {
    content.innerHTML = `
      <div class="flex items-center justify-center min-h-[60vh]">
        <div class="text-center">
          <div class="text-4xl mb-4">😕</div>
          <h2 class="text-xl text-gray-400">User not found</h2>
          <a href="/" data-link class="btn btn-primary mt-4">Go Home</a>
        </div>
      </div>
    `;
    return;
  }

  const stats = user.stats || { totalGames: 0, wins: 0, losses: 0, tournamentsWon: 0 };
  const winRate = stats.totalGames > 0 ? Math.round((stats.wins / stats.totalGames) * 100) : 0;

  content.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <!-- Profile Header -->
      <div class="card mb-8">
        <div class="flex flex-col md:flex-row items-center gap-6">
          <!-- Avatar -->
          <div class="relative">
            <div class="w-32 h-32 rounded-full bg-pong-primary/20 flex items-center justify-center border-4 border-pong-primary">
              <span class="font-game text-4xl text-pong-primary">${user.displayName?.charAt(0).toUpperCase() || 'U'}</span>
            </div>
            ${isOwnProfile ? `
              <button class="absolute bottom-0 right-0 bg-pong-light p-2 rounded-full hover:bg-pong-primary transition-colors">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"></path>
                </svg>
              </button>
            ` : ''}
          </div>
          
          <!-- User Info -->
          <div class="text-center md:text-left flex-1">
            <h1 class="font-game text-3xl text-gradient mb-2">${user.displayName || user.username}</h1>
            <p class="text-gray-400 mb-4">@${user.username}${isOwnProfile ? ` • ${user.email}` : ''}</p>
            <div class="flex flex-wrap justify-center md:justify-start gap-2">
              <span class="badge ${user.isOnline ? 'badge-online' : 'badge-offline'}">${user.isOnline ? t('profile.online') : t('profile.offline')}</span>
              ${user.language ? `<span class="text-gray-500">Language: ${user.language.toUpperCase()}</span>` : ''}
            </div>
          </div>
          
          ${isOwnProfile ? `
            <a href="/settings" data-link class="btn btn-secondary">
              ${t('profile.editProfile')}
            </a>
          ` : ''}
        </div>
      </div>
      
      <!-- Stats -->
      <h2 class="font-game text-xl text-pong-primary mb-4">${t('profile.stats')}</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="card text-center">
          <div class="font-game text-3xl text-pong-primary">${stats.wins}</div>
          <div class="text-gray-500">${t('profile.wins')}</div>
        </div>
        <div class="card text-center">
          <div class="font-game text-3xl text-red-400">${stats.losses}</div>
          <div class="text-gray-500">${t('profile.losses')}</div>
        </div>
        <div class="card text-center">
          <div class="font-game text-3xl text-pong-secondary">${winRate}%</div>
          <div class="text-gray-500">${t('profile.winRate')}</div>
        </div>
        <div class="card text-center">
          <div class="font-game text-3xl text-white">${stats.totalGames}</div>
          <div class="text-gray-500">${t('profile.totalGames')}</div>
        </div>
      </div>
      
      <!-- Match History -->
      <h2 class="font-game text-xl text-pong-primary mb-4">${t('profile.matchHistory')}</h2>
      <div class="card mb-8" id="match-history">
        <div class="text-center py-8 text-gray-500">
          <div class="loading-spinner mx-auto mb-4"></div>
          ${t('common.loading')}
        </div>
      </div>
      
      ${isOwnProfile ? `
        <!-- Friends -->
        <h2 class="font-game text-xl text-pong-primary mb-4">${t('profile.friends')}</h2>
        <div class="card" id="friends-list">
          <div class="text-center py-4 text-gray-500">
            No friends yet. Play some games to make friends!
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Load match history
  loadMatchHistory(user.id);
}

async function loadMatchHistory(userId: number): Promise<void> {
  const container = document.getElementById('match-history');
  if (!container) return;

  const result = await api.get<{ matches: Array<Record<string, unknown>> }>(`/users/${userId}/matches?limit=10`);

  if (!result.success || !result.data?.matches || result.data.matches.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-gray-500">
        No matches played yet. Start playing to see your history!
      </div>
    `;
    return;
  }

  const matchesHtml = result.data.matches.map((match) => {
    const isPlayer1 = match.player1_id === match.player1_id; // simplified
    const won = match.winner_id === (isPlayer1 ? match.player1_id : match.player2_id);
    const opponentName = isPlayer1 ? match.player2_display_name || match.player2_username : match.player1_display_name || match.player1_username;

    return `
      <div class="flex items-center justify-between py-3 border-b border-pong-light last:border-0">
        <div class="flex items-center gap-4">
          <span class="${won ? 'text-green-400' : 'text-red-400'} font-bold">${won ? 'WIN' : 'LOSS'}</span>
          <span>vs ${opponentName || 'Unknown'}</span>
        </div>
        <div class="text-right">
          <div class="font-game">${match.player1_score} - ${match.player2_score}</div>
          <div class="text-gray-500 text-sm">${match.match_type}</div>
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="space-y-0">${matchesHtml}</div>`;
}
