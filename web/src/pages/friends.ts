/**
 * Friends and Search Page
 */

import { t } from '../i18n';
import { renderNavbar } from '../components/navbar';
import { auth } from '../utils/auth';
import { api } from '../utils/api';
import { router } from '../utils/router';

export async function renderFriendsPage(): Promise<void> {
	renderNavbar();

	if (!auth.isAuthenticated()) {
		router.navigate('/login');
		return;
	}

	const app = document.getElementById('app');
	if (!app) return;

	let content = document.getElementById('page-content');
	if (!content) {
		content = document.createElement('div');
		content.id = 'page-content';
		app.appendChild(content);
	}

	content.innerHTML = `
    <div class="max-w-4xl mx-auto px-4 py-8">
      <h1 class="font-game text-3xl text-center text-gradient mb-8">${t('profile.friends')}</h1>
      
      <!-- Search Section -->
      <div class="card mb-8">
        <h2 class="font-game text-xl text-pong-primary mb-4">Find Players</h2>
        <div class="flex gap-2">
          <input 
            type="text" 
            id="user-search-input" 
            placeholder="Search by username..." 
            class="flex-1 bg-pong-darker border border-white/20 rounded px-4 py-2 text-white focus:outline-none focus:border-pong-primary"
          />
          <button id="user-search-btn" class="btn btn-primary">Search</button>
        </div>
        <div id="search-results" class="mt-4 space-y-2"></div>
      </div>

      <!-- Friends List Section -->
      <div class="card">
        <h2 class="font-game text-xl text-pong-secondary mb-4">My Friends</h2>
        <div id="friends-list-container" class="space-y-2">
          <div class="loading-spinner mx-auto my-4"></div>
        </div>
      </div>
    </div>
  `;

	setupSearch();
	loadFriends();
}

function setupSearch(): void {
	const input = document.getElementById('user-search-input') as HTMLInputElement;
	const btn = document.getElementById('user-search-btn');
	const results = document.getElementById('search-results');

	if (!btn || !input || !results) return;

	const handleSearch = async () => {
		const query = input.value.trim();
		if (query.length < 2) return;

		btn.textContent = 'Searching...';
		(btn as HTMLButtonElement).disabled = true;

		try {
			const result = await api.get<{ users: any[] }>(`/users/search?q=${encodeURIComponent(query)}`);
			if (result.success && result.data) {
				renderSearchResults(results, result.data.users);
			}
		} catch (err) {
			console.error('Search error:', err);
		} finally {
			btn.textContent = 'Search';
			(btn as HTMLButtonElement).disabled = false;
		}
	};

	btn.addEventListener('click', handleSearch);
	input.addEventListener('keypress', (e) => {
		if (e.key === 'Enter') handleSearch();
	});
}

function renderSearchResults(container: HTMLElement, users: any[]): void {
	if (users.length === 0) {
		container.innerHTML = `<p class="text-white/40 text-center py-4">No users found</p>`;
		return;
	}

	container.innerHTML = users.map(user => `
    <div class="flex items-center justify-between p-3 bg-pong-darker rounded-lg border border-white/5 hover:border-pong-primary/30 transition-colors">
      <div class="flex items-center gap-3">
        <img src="${user.avatarUrl || '/default-avatar.png'}" alt="" class="w-10 h-10 rounded-full object-cover">
        <div>
          <div class="text-white font-medium">${user.displayName}</div>
          <div class="text-white/50 text-xs">@${user.username}</div>
        </div>
        <span class="badge ${user.isOnline ? 'badge-online' : 'badge-offline'} ml-2"></span>
      </div>
      <div class="flex gap-2">
        <a href="/profile/${user.id}" data-link class="btn btn-secondary text-xs px-3 py-1">View Profile</a>
        <button class="btn btn-primary text-xs px-3 py-1 add-friend-btn" data-user-id="${user.id}">Add Friend</button>
      </div>
    </div>
  `).join('');

	container.querySelectorAll('.add-friend-btn').forEach(btn => {
		btn.addEventListener('click', async (e) => {
			const targetBtn = e.currentTarget as HTMLButtonElement;
			const targetId = targetBtn.getAttribute('data-user-id');
			const currentUser = auth.getUser();
			if (!currentUser || !targetId) return;

			targetBtn.disabled = true;
			targetBtn.textContent = 'Sending...';

			const result = await api.post(`/users/${currentUser.id}/friends`, { friendId: parseInt(targetId) });
			if (result.success) {
				targetBtn.textContent = 'Sent';
				targetBtn.classList.replace('btn-primary', 'btn-secondary');
			} else {
				targetBtn.disabled = false;
				targetBtn.textContent = 'Add Friend';
				alert(result.error || 'Failed to send request');
			}
		});
	});
}

async function loadFriends(): Promise<void> {
	const container = document.getElementById('friends-list-container');
	if (!container) return;

	const user = auth.getUser();
	if (!user) return;

	try {
		const result = await api.get<{ friends: any[] }>(`/users/${user.id}/friends`);
		if (result.success && result.data) {
			if (result.data.friends.length === 0) {
				container.innerHTML = `<p class="text-white/40 text-center py-4">${t('profile.noFriends')}</p>`;
				return;
			}

			container.innerHTML = result.data.friends.map(f => `
        <div class="flex items-center justify-between p-3 bg-pong-darker rounded-lg">
          <div class="flex items-center gap-3">
            <img src="${f.avatar_url || '/default-avatar.png'}" alt="" class="w-10 h-10 rounded-full object-cover">
            <div>
              <div class="text-white font-medium">${f.display_name}</div>
              <div class="text-white/50 text-xs">@${f.username}</div>
            </div>
            <span class="badge ${f.is_online ? 'badge-online' : 'badge-offline'} ml-2"></span>
          </div>
          <div class="flex gap-2">
            <a href="/profile/${f.id}" data-link class="btn btn-secondary text-xs px-3 py-1">Profile</a>
            <button class="btn btn-primary text-xs px-3 py-1 invite-game-btn" data-user-id="${f.id}">Invite</button>
          </div>
        </div>
      `).join('');
			container.querySelectorAll('.invite-game-btn').forEach(btn => {
				btn.addEventListener('click', async (e) => {
					const targetBtn = e.currentTarget as HTMLButtonElement;
					const targetId = targetBtn.getAttribute('data-user-id');
					if (!targetId) return;

					targetBtn.disabled = true;
					targetBtn.textContent = 'Inviting...';

					try {
						const result = await api.post<{ roomId: string; invitedUserId: number }>(`/users/invite/${targetId}`, {});
						if (result.success && result.data) {
							// Navigate to game with invite mode, roomId, and invitedUserId for private room
							router.navigate(`/game?mode=invite&roomId=${result.data.roomId}&invitedUserId=${result.data.invitedUserId}`);
						} else {
							targetBtn.disabled = false;
							targetBtn.textContent = 'Invite';
							alert(result.error || 'Failed to send invite');
						}
					} catch (err) {
						console.error('Invite error:', err);
						targetBtn.disabled = false;
						targetBtn.textContent = 'Invite';
					}
				});
			});
		}
	} catch (err) {
		console.error('Load friends error:', err);
		container.innerHTML = `<p class="text-red-400 text-center py-4">Error loading friends</p>`;
	}
}
