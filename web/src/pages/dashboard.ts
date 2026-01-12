/**
 * Dashboard Page
 * User and game statistics with visual charts
 */

import { t } from '../i18n';
import { renderNavbar } from '../components/navbar';
import api from '../utils/api';
import { auth } from '../utils/auth';

interface UserStats {
	username: string;
	display_name: string;
	avatar_url: string;
	total_games: number;
	wins: number;
	losses: number;
	win_rate: number;
	win_streak: number;
	best_win_streak: number;
	total_points_scored: number;
	total_points_conceded: number;
	tournaments_played: number;
	tournaments_won: number;
}

interface MatchHistory {
	id: number;
	opponent_name: string;
	player_score: number;
	opponent_score: number;
	won: boolean;
	match_type: string;
	played_at: string;
}

interface LeaderboardEntry {
	rank: number;
	user_id: number;
	username: string;
	display_name: string;
	avatar_url: string;
	wins: number;
	losses: number;
	win_rate: number;
}

interface GlobalStats {
	total_users: number;
	total_matches: number;
	total_tournaments: number;
	matches_today: number;
	active_tournaments: number;
}

export async function renderDashboardPage(): Promise<void> {
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
    <div class="max-w-6xl mx-auto px-4 py-8">
      <h1 class="font-game text-3xl text-center text-gradient mb-8">📊 Dashboard</h1>
      
      <!-- Global Stats -->
      <div id="global-stats" class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div class="text-center text-gray-500">Loading stats...</div>
      </div>
      
      <div class="grid md:grid-cols-3 gap-8">
        <!-- User Stats (if logged in) -->
        <div class="md:col-span-2 space-y-6">
          <div id="user-stats-section"></div>
          <div id="match-history-section"></div>
        </div>
        
        <!-- Leaderboard -->
        <div>
          <div id="leaderboard-section">
            <div class="card">
              <h2 class="font-game text-xl text-yellow-500 mb-4">🏆 Leaderboard</h2>
              <div class="text-center text-gray-500">Loading...</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

	// Load all data
	await Promise.all([
		loadGlobalStats(),
		loadLeaderboard(),
		loadUserStats(),
		loadMatchHistory(),
	]);
}

async function loadGlobalStats(): Promise<void> {
	const container = document.getElementById('global-stats');
	if (!container) return;

	const result = await api.get<{ stats: GlobalStats }>('/stats/global');

	if (!result.success || !result.data) {
		container.innerHTML = '<div class="text-red-400">Failed to load stats</div>';
		return;
	}

	const { stats } = result.data;

	container.innerHTML = `
    <div class="card text-center">
      <div class="text-3xl font-game text-pong-primary">${stats.total_users}</div>
      <div class="text-gray-500 text-sm">Players</div>
    </div>
    <div class="card text-center">
      <div class="text-3xl font-game text-pong-secondary">${stats.total_matches}</div>
      <div class="text-gray-500 text-sm">Matches</div>
    </div>
    <div class="card text-center">
      <div class="text-3xl font-game text-yellow-500">${stats.total_tournaments}</div>
      <div class="text-gray-500 text-sm">Tournaments</div>
    </div>
    <div class="card text-center">
      <div class="text-3xl font-game text-green-500">${stats.matches_today}</div>
      <div class="text-gray-500 text-sm">Today</div>
    </div>
    <div class="card text-center">
      <div class="text-3xl font-game text-purple-500">${stats.active_tournaments}</div>
      <div class="text-gray-500 text-sm">Active</div>
    </div>
  `;
}

async function loadUserStats(): Promise<void> {
	const container = document.getElementById('user-stats-section');
	if (!container) return;

	if (!auth.isAuthenticated()) {
		container.innerHTML = `
      <div class="card">
        <h2 class="font-game text-xl text-pong-primary mb-4">Your Stats</h2>
        <p class="text-gray-500 text-center py-4">
          <a href="/login" data-link class="text-pong-primary hover:underline">Login</a> to see your stats
        </p>
      </div>
    `;
		return;
	}

	const result = await api.get<{ stats: UserStats }>('/stats/me');

	if (!result.success || !result.data) {
		container.innerHTML = `
      <div class="card">
        <h2 class="font-game text-xl text-pong-primary mb-4">Your Stats</h2>
        <p class="text-gray-500 text-center py-4">No stats yet. Play some games!</p>
      </div>
    `;
		return;
	}

	const { stats } = result.data;

	container.innerHTML = `
    <div class="card">
      <div class="flex items-center gap-4 mb-6">
        <img src="${stats.avatar_url}" alt="Avatar" class="w-16 h-16 rounded-full">
        <div>
          <h2 class="font-game text-xl text-pong-primary">${stats.display_name}</h2>
          <p class="text-gray-500">@${stats.username}</p>
        </div>
      </div>
      
      <!-- Win Rate Chart (Simple CSS bar) -->
      <div class="mb-6">
        <div class="flex justify-between text-sm text-gray-400 mb-2">
          <span>Win Rate</span>
          <span class="font-game">${stats.win_rate}%</span>
        </div>
        <div class="h-4 bg-pong-darker rounded-full overflow-hidden">
          <div 
            class="h-full bg-gradient-to-r from-pong-primary to-green-400 transition-all duration-500"
            style="width: ${stats.win_rate}%"
          ></div>
        </div>
      </div>
      
      <!-- Stats Grid -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div class="text-center p-3 bg-pong-darker rounded-lg">
          <div class="text-2xl font-game text-white">${stats.total_games}</div>
          <div class="text-gray-500 text-xs">Games</div>
        </div>
        <div class="text-center p-3 bg-pong-darker rounded-lg">
          <div class="text-2xl font-game text-green-400">${stats.wins}</div>
          <div class="text-gray-500 text-xs">Wins</div>
        </div>
        <div class="text-center p-3 bg-pong-darker rounded-lg">
          <div class="text-2xl font-game text-red-400">${stats.losses}</div>
          <div class="text-gray-500 text-xs">Losses</div>
        </div>
        <div class="text-center p-3 bg-pong-darker rounded-lg">
          <div class="text-2xl font-game text-yellow-400">${stats.win_streak}</div>
          <div class="text-gray-500 text-xs">Streak</div>
        </div>
      </div>
      
      <!-- Additional Stats -->
      <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div class="flex justify-between text-gray-400">
          <span>Best Streak:</span>
          <span class="text-white">${stats.best_win_streak}</span>
        </div>
        <div class="flex justify-between text-gray-400">
          <span>Points Scored:</span>
          <span class="text-white">${stats.total_points_scored}</span>
        </div>
        <div class="flex justify-between text-gray-400">
          <span>Tournaments Played:</span>
          <span class="text-white">${stats.tournaments_played}</span>
        </div>
        <div class="flex justify-between text-gray-400">
          <span>Tournaments Won:</span>
          <span class="text-white">${stats.tournaments_won}</span>
        </div>
      </div>
    </div>
  `;
}

async function loadMatchHistory(): Promise<void> {
	const container = document.getElementById('match-history-section');
	if (!container) return;

	if (!auth.isAuthenticated()) {
		return;
	}

	const result = await api.get<{ history: MatchHistory[] }>('/stats/me/history?limit=10');

	if (!result.success || !result.data?.history.length) {
		container.innerHTML = `
      <div class="card">
        <h2 class="font-game text-lg text-pong-secondary mb-4">Match History</h2>
        <p class="text-gray-500 text-center py-4">No matches played yet</p>
      </div>
    `;
		return;
	}

	const { history } = result.data;

	container.innerHTML = `
    <div class="card">
      <h2 class="font-game text-lg text-pong-secondary mb-4">Recent Matches</h2>
      <div class="space-y-2">
        ${history.map(m => `
          <div class="flex items-center justify-between p-3 bg-pong-darker rounded-lg ${m.won ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}">
            <div class="flex items-center gap-3">
              <span class="text-lg ${m.won ? 'text-green-400' : 'text-red-400'}">${m.won ? 'W' : 'L'}</span>
              <span class="text-white">vs ${m.opponent_name}</span>
              <span class="badge text-xs ${getMatchTypeBadge(m.match_type)}">${m.match_type}</span>
            </div>
            <div class="text-right">
              <span class="font-game text-lg">${m.player_score} - ${m.opponent_score}</span>
              ${m.played_at ? `<div class="text-gray-500 text-xs">${formatDate(m.played_at)}</div>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

async function loadLeaderboard(): Promise<void> {
	const container = document.getElementById('leaderboard-section');
	if (!container) return;

	const result = await api.get<{ leaderboard: LeaderboardEntry[] }>('/stats/leaderboard?limit=10');

	if (!result.success || !result.data?.leaderboard.length) {
		container.innerHTML = `
      <div class="card">
        <h2 class="font-game text-xl text-yellow-500 mb-4">🏆 Leaderboard</h2>
        <p class="text-gray-500 text-center py-4">No players yet</p>
      </div>
    `;
		return;
	}

	const { leaderboard } = result.data;

	container.innerHTML = `
    <div class="card">
      <h2 class="font-game text-xl text-yellow-500 mb-4">🏆 Leaderboard</h2>
      <div class="space-y-2">
        ${leaderboard.map((p, i) => `
          <div class="flex items-center gap-3 p-2 rounded-lg ${i < 3 ? 'bg-pong-darker' : ''}">
            <span class="font-game text-lg w-8 ${getRankColor(i + 1)}">${getRankDisplay(i + 1)}</span>
            <img src="${p.avatar_url}" alt="" class="w-8 h-8 rounded-full">
            <div class="flex-1">
              <div class="text-white text-sm">${p.display_name}</div>
              <div class="text-gray-500 text-xs">${p.wins}W - ${p.losses}L</div>
            </div>
            <span class="font-game text-sm ${p.win_rate >= 50 ? 'text-green-400' : 'text-gray-400'}">${p.win_rate}%</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function getMatchTypeBadge(type: string): string {
	switch (type) {
		case 'tournament': return 'bg-yellow-500/20 text-yellow-400';
		case 'ai': return 'bg-purple-500/20 text-purple-400';
		case 'casual': return 'bg-blue-500/20 text-blue-400';
		default: return 'bg-gray-500/20 text-gray-400';
	}
}

function formatDate(dateStr: string): string {
	const date = new Date(dateStr);
	return date.toLocaleDateString();
}

function getRankColor(rank: number): string {
	switch (rank) {
		case 1: return 'text-yellow-400';
		case 2: return 'text-gray-300';
		case 3: return 'text-amber-600';
		default: return 'text-gray-500';
	}
}

function getRankDisplay(rank: number): string {
	switch (rank) {
		case 1: return '🥇';
		case 2: return '🥈';
		case 3: return '🥉';
		default: return `#${rank}`;
	}
}
