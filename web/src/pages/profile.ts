// Profile Page

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
          <h2 class="text-xl text-white/70">${t('profile.userNotFound')}</h2>
          <a href="/" data-link class="btn btn-primary mt-4">${t('profile.goHome')}</a>
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
            <div class="w-32 h-32 rounded-full bg-pong-primary/20 flex items-center justify-center border-4 border-pong-primary overflow-hidden">
              ${user.avatarUrl && user.avatarUrl !== '/default-avatar.png'
      ? `<img src="${user.avatarUrl}" alt="${user.displayName}" class="w-full h-full object-cover" />`
      : `<img src="/default-avatar.png" alt="${user.displayName}" class="w-full h-full object-cover" />`
    }
            </div>
            ${isOwnProfile ? `
              <div class="absolute bottom-0 right-0 flex gap-1">
                <button id="avatar-upload-btn" class="bg-pong-primary p-2 rounded-full hover:bg-pong-secondary transition-colors" title="${t('profile.changeAvatar')}">
                  <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  </svg>
                </button>
                ${user.avatarUrl && user.avatarUrl !== '/default-avatar.png' ? `
                  <button id="avatar-remove-btn" class="bg-red-500 p-2 rounded-full hover:bg-red-600 transition-colors" title="${t('profile.removeAvatar')}">
                    <svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </button>
                ` : ''}
              </div>
              <input type="file" id="avatar-input" class="hidden" accept="image/jpeg,image/jpg,image/png,image/gif,image/webp" />
            ` : ''}
          </div>
          
          <!-- User Info -->
          <div class="text-center md:text-left flex-1">
            <h1 class="font-game text-3xl text-gradient mb-2">${user.displayName || user.username}</h1>
            <p class="text-white/70 mb-4">@${user.username}${isOwnProfile ? ` • ${user.email}` : ''}</p>
            <div class="flex flex-wrap justify-center md:justify-start gap-2">
              <span class="badge ${(isOwnProfile || user.isOnline) ? 'badge-online' : 'badge-offline'}">${(isOwnProfile || user.isOnline) ? t('profile.online') : t('profile.offline')}</span>
              ${user.language ? `<span class="text-white/50"> ${user.language.toUpperCase()}</span>` : ''}
            </div>
          </div>
          
          ${isOwnProfile ? `
            <a href="/settings" data-link class="btn btn-secondary">
              ${t('profile.editProfile')}
            </a>
          ` : `
            <div id="friendship-action-container">
              <div class="loading-spinner w-6 h-6"></div>
            </div>
          `}
        </div>
      </div>
      
      <!-- Stats -->
      <h2 class="font-game text-xl text-pong-primary mb-4">${t('profile.stats')}</h2>
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div class="card text-center">
          <div class="font-game text-3xl text-pong-primary">${stats.wins}</div>
          <div class="text-white/60">${t('profile.wins')}</div>
        </div>
        <div class="card text-center">
          <div class="font-game text-3xl text-red-400">${stats.losses}</div>
          <div class="text-white/60">${t('profile.losses')}</div>
        </div>
        <div class="card text-center">
          <div class="font-game text-3xl text-pong-secondary">${winRate}%</div>
          <div class="text-white/60">${t('profile.winRate')}</div>
        </div>
        <div class="card text-center">
          <div class="font-game text-3xl text-white">${stats.totalGames}</div>
          <div class="text-white/60">${t('profile.totalGames')}</div>
        </div>
      </div>
      
      <!-- Match History -->
      <h2 class="font-game text-xl text-pong-primary mb-4">${t('profile.matchHistory')}</h2>
      <div class="card mb-8" id="match-history">
        <div class="text-center py-8 text-white/60">
          <div class="loading-spinner mx-auto mb-4"></div>
          ${t('common.loading')}
        </div>
      </div>
      
      ${isOwnProfile ? `
        <!-- Friends -->
        <h2 class="font-game text-xl text-pong-primary mb-4">${t('profile.friends')}</h2>
        <div class="card" id="friends-list">
          <div class="text-center py-4 text-white/60">
            ${t('profile.noFriends')}
          </div>
        </div>
      ` : ''}
    </div>
  `;

  // Load match history
  loadMatchHistory(user.id);

  // Load friends list (for own profile)
  if (isOwnProfile) {
    loadFriendsList(user.id);
    setupAvatarUpload(user.id);
  } else {
    setupRelationshipButton(user.id);
  }
}

async function setupRelationshipButton(targetUserId: number): Promise<void> {
  const container = document.getElementById('friendship-action-container');
  if (!container) return;

  const result = await api.get<{ status: string }>(`/users/relationship/${targetUserId}`);
  if (!result.success || !result.data) {
    container.innerHTML = '';
    return;
  }

  const status = result.data.status;
  renderRelationshipButton(container, status, targetUserId);
}

// Setup avatar upload functionality
function setupAvatarUpload(userId: number): void {
  const uploadBtn = document.getElementById('avatar-upload-btn');
  const avatarInput = document.getElementById('avatar-input') as HTMLInputElement;

  if (uploadBtn && avatarInput) {
    uploadBtn.addEventListener('click', () => avatarInput.click());

    avatarInput.addEventListener('change', async () => {
      const file = avatarInput.files?.[0];
      if (!file) return;

      console.log('File selected:', file.name, 'Size:', file.size, 'Type:', file.type);

      // Check file type first
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        alert(t('errors.invalidFileType'));
        avatarInput.value = '';
        return;
      }

      // Check file size before uploading (5MB limit)
      const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
      if (file.size > MAX_FILE_SIZE) {
        alert(t('errors.fileTooLarge'));
        avatarInput.value = ''; // Reset input
        return;
      }

      // Check image resolution
      const MAX_WIDTH = 2048;
      const MAX_HEIGHT = 2048;

      try {
        console.log('Checking image dimensions...');

        // Create an image element to check dimensions
        const img = new Image();
        const imageLoadPromise = new Promise<void>((resolve, reject) => {
          img.onload = () => {
            console.log('Image loaded. Dimensions:', img.width, 'x', img.height);
            resolve();
          };
          img.onerror = (e) => {
            console.error('Image load error:', e);
            reject(new Error('Failed to load image'));
          };
        });

        img.src = URL.createObjectURL(file);
        await imageLoadPromise;

        // Check dimensions
        if (img.width > MAX_WIDTH || img.height > MAX_HEIGHT) {
          console.log('Image too large! Max:', MAX_WIDTH, 'x', MAX_HEIGHT);
          alert(t('errors.imageTooLarge'));
          URL.revokeObjectURL(img.src); // Clean up
          avatarInput.value = ''; // Reset input
          return;
        }

        console.log('Image dimensions OK, proceeding with upload...');
        URL.revokeObjectURL(img.src); // Clean up
      } catch (err) {
        console.error('Error checking image dimensions:', err);
        alert(t('errors.uploadFailed'));
        avatarInput.value = '';
        return;
      }

      const formData = new FormData();
      formData.append('avatar', file);

      try {
        console.log('Uploading avatar...');
        const result = await api.post<{ avatarUrl: string }>(`/users/${userId}/avatar`, formData);

        if (result.success && result.data) {
          console.log('Upload successful:', result.data.avatarUrl);
          // Update avatar display
          const avatarContainer = document.querySelector('.w-32.h-32.rounded-full');
          if (avatarContainer) {
            avatarContainer.innerHTML = `<img src="${result.data.avatarUrl}" alt="Avatar" class="w-full h-full object-cover" />`;
          }
          // Reload page to show remove button
          renderProfilePage();
        } else {
          console.error('Upload failed:', result.error);
          // Check if error is a translation key
          const errorMsg = result.error || '';
          if (errorMsg.startsWith('errors.')) {
            alert(t(errorMsg));
          } else {
            alert(errorMsg || t('errors.uploadFailed'));
          }
        }
      } catch (err) {
        console.error('Avatar upload error:', err);
        alert(t('errors.uploadFailed'));
      } finally {
        // Reset input to allow selecting the same file again
        avatarInput.value = '';
      }
    });
  }

  // Setup avatar remove functionality
  const removeBtn = document.getElementById('avatar-remove-btn');
  if (removeBtn) {
    removeBtn.addEventListener('click', async () => {
      if (!confirm(t('profile.removeAvatar') + '?')) return;

      try {
        const result = await api.delete(`/users/${userId}/avatar`);

        if (result.success) {
          // Reload page to update UI
          renderProfilePage();
        } else {
          alert(result.error || 'Failed to remove avatar');
        }
      } catch (err) {
        console.error('Avatar remove error:', err);
        alert('Failed to remove avatar');
      }
    });
  }
}

function renderRelationshipButton(container: HTMLElement, status: string, targetUserId: number): void {
  let buttonHtml = '';

  switch (status) {
    case 'none':
      buttonHtml = `<button id="relationship-btn" class="btn btn-primary">${t('profile.addFriend')}</button>`;
      break;
    case 'request_sent':
      buttonHtml = `<button id="relationship-btn" class="btn btn-secondary opacity-50 cursor-default" disabled>${t('profile.friendRequestPending')}</button>`;
      break;
    case 'request_received':
      buttonHtml = `<button id="relationship-btn" class="btn btn-primary animate-pulse">${t('notifications.accept')}</button>`;
      break;
    case 'friends':
      buttonHtml = `
        <div class="relative group">
          <button id="relationship-btn" class="btn btn-secondary">${t('profile.friends') || 'Friends'}</button>
          <div class="absolute right-0 top-full mt-1 w-40 bg-pong-dark border border-pong-light rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
            <button id="remove-friend-btn" class="w-full text-left px-4 py-2 text-red-400 hover:bg-pong-light/50 rounded-lg">Remove Friend</button>
          </div>
        </div>
      `;
      break;
    default:
      container.innerHTML = '';
      return;
  }

  container.innerHTML = buttonHtml;

  const btn = document.getElementById('relationship-btn');
  if (!btn) return;

  btn.addEventListener('click', async () => {
    const currentUser = auth.getUser();
    if (!currentUser) {
      router.navigate('/login');
      return;
    }

    try {
      if (status === 'none') {
        const res = await api.post(`/users/${currentUser.id}/friends`, { friendId: targetUserId });
        if (res.success) setupRelationshipButton(targetUserId);
        else alert(res.error || 'Failed to send request');
      } else if (status === 'request_received') {
        const res = await api.put(`/users/${currentUser.id}/friends/${targetUserId}`, { action: 'accept' });
        if (res.success) setupRelationshipButton(targetUserId);
        else alert(res.error || 'Failed to accept request');
      }
    } catch (err) {
      console.error('Friendship action error:', err);
    }
  });

  // Add remove friend listener if friends
  if (status === 'friends') {
    const removeBtn = document.getElementById('remove-friend-btn');
    if (removeBtn) {
      removeBtn.addEventListener('click', async () => {
        const currentUser = auth.getUser();
        if (!currentUser) return;

        if (confirm('Are you sure you want to remove this friend?')) {
          const res = await api.delete(`/users/${currentUser.id}/friends/${targetUserId}`);
          if (res.success) {
            setupRelationshipButton(targetUserId);
          } else {
            alert(res.error || 'Failed to remove friend');
          }
        }
      });
    }
  }
}

// Load friends list
async function loadFriendsList(userId: number): Promise<void> {
  const container = document.getElementById('friends-list');
  if (!container) return;

  const result = await api.get<{ friends: Array<Record<string, unknown>> }>(`/users/${userId}/friends`);

  if (!result.success || !result.data?.friends || result.data.friends.length === 0) {
    container.innerHTML = `
      <div class="text-center py-4 text-white/60">
        ${t('profile.noFriends')}
      </div>
    `;
    return;
  }

  const friendsHtml = result.data.friends.map((friend) => `
    <a href="/profile/${friend.id}" data-link class="flex items-center justify-between py-3 border-b border-pong-light last:border-0 hover:bg-white/5 px-2 rounded transition-colors">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 rounded-full bg-pong-primary/20 flex items-center justify-center overflow-hidden">
          ${friend.avatar_url && friend.avatar_url !== '/default-avatar.png'
      ? `<img src="${friend.avatar_url}" alt="${friend.display_name}" class="w-full h-full object-cover" />`
      : `<img src="/default-avatar.png" alt="${friend.display_name}" class="w-full h-full object-cover" />`
    }
        </div>
        <div>
          <div class="font-medium">${friend.display_name || friend.username}</div>
          <div class="text-white/50 text-sm">@${friend.username}</div>
        </div>
      </div>
      <span class="badge ${friend.is_online ? 'badge-online' : 'badge-offline'}">
        ${friend.is_online ? t('profile.online') : t('profile.offline')}
      </span>
    </a>
  `).join('');

  container.innerHTML = `<div class="space-y-0">${friendsHtml}</div>`;
}

async function loadMatchHistory(userId: number): Promise<void> {
  const container = document.getElementById('match-history');
  if (!container) return;

  const result = await api.get<{ matches: Array<Record<string, unknown>> }>(`/users/${userId}/matches?limit=10`);

  if (!result.success || !result.data?.matches || result.data.matches.length === 0) {
    container.innerHTML = `
      <div class="text-center py-8 text-white/60">
        ${t('profile.noMatches')}
      </div>
    `;
    return;
  }

  const matchesHtml = result.data.matches.map((match) => {
    const isPlayer1 = match.player1_id === userId;
    const won = match.winner_id === userId;
    const opponentNameRaw = isPlayer1
      ? (match.player2_display_name || match.player2_username || 'Deleted User')
      : (match.player1_display_name || match.player1_username || 'Deleted User');

    // Localize 'Deleted User' if detected
    const opponentName = (opponentNameRaw === 'Deleted User' || opponentNameRaw === 'Unknown')
      ? t('common.deletedUser')
      : opponentNameRaw;
    const myScore = isPlayer1 ? match.player1_score : match.player2_score;
    const oppScore = isPlayer1 ? match.player2_score : match.player1_score;
    const matchDate = match.ended_at ? formatMatchDate(match.ended_at as string) : '';

    return `
      <div class="flex items-center justify-between py-3 border-b border-pong-light last:border-0">
        <div class="flex items-center gap-4">
          <span class="${won ? 'text-green-400' : 'text-red-400'} font-bold">${won ? 'WIN' : 'LOSS'}</span>
          <span>vs ${opponentName}</span>
          <span class="badge text-xs ${getMatchTypeBadge(match.match_type as string)}">${getMatchTypeLabel(match.match_type as string)}</span>
        </div>
        <div class="text-right">
          <div class="font-game">${myScore} - ${oppScore}</div>
          ${matchDate ? `<div class="text-white/50 text-xs">${matchDate}</div>` : ''}
        </div>
      </div>
    `;
  }).join('');

  container.innerHTML = `<div class="space-y-0">${matchesHtml}</div>`;
}

// Format match date - handles SQLite UTC timestamps
function formatMatchDate(dateStr: string): string {
  let date: Date;
  if (dateStr && !dateStr.includes('Z') && !dateStr.includes('+')) {
    const isoDate = dateStr.replace(' ', 'T') + 'Z';
    date = new Date(isoDate);
  } else {
    date = new Date(dateStr);
  }
  return date.toLocaleDateString();
}

// Get badge style for match type
function getMatchTypeBadge(type: string): string {
  switch (type) {
    case 'tournament': return 'bg-yellow-500/20 text-yellow-400';
    case 'ai': return 'bg-purple-500/20 text-purple-400';
    case 'casual': return 'bg-blue-500/20 text-blue-400';
    case 'local': return 'bg-green-500/20 text-green-400';
    case 'online': return 'bg-cyan-500/20 text-cyan-400';
    default: return 'bg-gray-500/20 text-white/80';
  }
}

// Get translated label for match type
function getMatchTypeLabel(type: string): string {
  return t(`dashboard.matchTypes.${type}`) || type;
}
