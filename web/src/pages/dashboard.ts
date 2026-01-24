// Dashboard Page
// User and game statistics with visual charts

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
      <h1 class="font-game text-3xl text-center text-gradient mb-8">${t('dashboard.title')}</h1>
      
      <!-- Global Stats -->
      <div id="global-stats" class="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <div class="text-center text-white/60">${t('dashboard.loadingStats')}</div>
      </div>
      
      <div class="grid md:grid-cols-3 gap-8">
        <!-- Leaderboard (first on mobile) -->
        <div class="order-first md:order-last">
          <div id="leaderboard-section">
            <div class="card">
              <h2 class="font-game text-xl text-yellow-500 mb-4">🏆 ${t('dashboard.leaderboard')}</h2>
              <div class="text-center text-white/60">${t('common.loading')}</div>
            </div>
          </div>
        </div>
        
        <!-- User Stats (if logged in) -->
        <div class="md:col-span-2 space-y-6 order-last md:order-first">
          <div id="user-stats-section"></div>
          <div id="match-history-section"></div>
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
    container.innerHTML = `<div class="text-red-400">${t('dashboard.failedLoad')}</div>`;
    return;
  }

  const { stats } = result.data;

  container.innerHTML = `
    <div class="card text-center">
      <div class="text-3xl font-game text-pong-primary">${stats.total_users}</div>
      <div class="text-white/60 text-sm">${t('dashboard.players')}</div>
    </div>
    <div class="card text-center">
      <div class="text-3xl font-game text-pong-secondary">${stats.total_matches}</div>
      <div class="text-white/60 text-sm">${t('dashboard.matches')}</div>
    </div>
    <div class="card text-center">
      <div class="text-3xl font-game text-yellow-500">${stats.total_tournaments}</div>
      <div class="text-white/60 text-sm">${t('dashboard.tournaments')}</div>
    </div>
    <div class="card text-center">
      <div class="text-3xl font-game text-green-500">${stats.matches_today}</div>
      <div class="text-white/60 text-sm">${t('dashboard.today')}</div>
    </div>
    <div class="card text-center">
      <div class="text-3xl font-game text-purple-500">${stats.active_tournaments}</div>
      <div class="text-white/60 text-sm">${t('dashboard.active')}</div>
    </div>
  `;
}

async function loadUserStats(): Promise<void> {
  const container = document.getElementById('user-stats-section');
  if (!container) return;

  if (!auth.isAuthenticated()) {
    container.innerHTML = `
      <div class="card">
        <h2 class="font-game text-xl text-pong-primary mb-4">${t('dashboard.winRate') || 'Your Stats'}</h2>
        <p class="text-white/60 text-center py-4">
          <a href="/login" data-link class="text-pong-primary hover:underline">${t('auth.login')}</a> ${t('dashboard.loadingStats') || 'to see your stats'}
        </p>
      </div>
    `;
    return;
  }

  const result = await api.get<{ stats: UserStats }>('/stats/me');

  if (!result.success || !result.data) {
    container.innerHTML = `
      <div class="card">
        <h2 class="font-game text-xl text-pong-primary mb-4">${t('dashboard.yourStats')}</h2>
        <p class="text-white/60 text-center py-4">${t('dashboard.noStatsYet')}</p>
      </div>
    `;
    return;
  }

  const { stats } = result.data;

  container.innerHTML = `
    <div class="card">
      <div class="flex items-center gap-4 mb-6">
        <img src="${stats.avatar_url || '/default-avatar.png'}" alt="Avatar" class="w-16 h-16 rounded-full object-cover bg-pong-primary/20">
        <div>
          <h2 class="font-game text-xl text-pong-primary">${stats.display_name}</h2>
          <p class="text-white/60">@${stats.username}</p>
        </div>
      </div>
      
      <!-- Win Rate Chart (Simple CSS bar) -->
      <div class="mb-6">
        <div class="flex justify-between text-sm text-white/70 mb-2">
          <span>${t('dashboard.winRate')}</span>
          <span class="font-game">${stats.win_rate}%</span>
        </div>
        <div class="h-4 bg-pong-darker rounded-full overflow-hidden">
          <div 
            class="h-full bg-gradient-to-r from-pong-primary to-green-400 transition-all duration-500"
            style="width: ${stats.win_rate}%"
          ></div>
        </div>
      </div>
      
      <!-- Wins vs Losses Pie Chart -->
      <div class="mb-6 p-4 bg-pong-darker rounded-lg">
        <h3 class="text-sm text-white/70 mb-4 text-center">${t('dashboard.winsVsLosses') || 'Wins vs Losses'}</h3>
        <div class="flex items-center justify-center gap-8">
          <!-- Pie Chart SVG -->
          <div class="relative w-32 h-32">
            ${renderPieChart(stats.wins, stats.losses)}
          </div>
          <!-- Legend -->
          <div class="space-y-2">
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded-full bg-green-400"></div>
              <span class="text-white text-sm">${t('dashboard.wins')}: <span class="font-game">${stats.wins}</span></span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-4 h-4 rounded-full bg-red-400"></div>
              <span class="text-white text-sm">${t('dashboard.losses')}: <span class="font-game">${stats.losses}</span></span>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Stats Grid -->
      <div class="grid grid-cols-3 gap-4">
        <div class="text-center p-3 bg-pong-darker rounded-lg">
          <div class="text-2xl font-game text-white">${stats.total_games}</div>
          <div class="text-white/60 text-xs">${t('dashboard.games')}</div>
        </div>
        <div class="text-center p-3 bg-pong-darker rounded-lg">
          <div class="text-2xl font-game text-green-400">${stats.wins}</div>
          <div class="text-white/60 text-xs">${t('dashboard.wins')}</div>
        </div>
        <div class="text-center p-3 bg-pong-darker rounded-lg">
          <div class="text-2xl font-game text-red-400">${stats.losses}</div>
          <div class="text-white/60 text-xs">${t('dashboard.losses')}</div>
        </div>
      </div>
      
      <!-- Additional Stats -->
      <div class="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div class="flex justify-between text-white/70">
          <span>${t('dashboard.pointsScored')}:</span>
          <span class="text-white">${stats.total_points_scored}</span>
        </div>
        <div class="flex justify-between text-white/70">
          <span>${t('dashboard.tournamentsPlayed')}:</span>
          <span class="text-white">${stats.tournaments_played}</span>
        </div>
        <div class="flex justify-between text-white/70">
          <span>${t('dashboard.tournamentsWon')}:</span>
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
        <h2 class="font-game text-lg text-pong-secondary mb-4">${t('dashboard.matchHistory')}</h2>
        <p class="text-white/60 text-center py-4">${t('dashboard.noMatches')}</p>
      </div>
    `;
    return;
  }

  const { history } = result.data;

  container.innerHTML = `
    <div class="card">
      <h2 class="font-game text-lg text-pong-secondary mb-4">${t('dashboard.recentMatches')}</h2>
      <div class="space-y-2">
        ${history.map(m => `
          <div class="flex items-center justify-between p-3 bg-pong-darker rounded-lg ${m.won ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'}">
            <div class="flex items-center gap-3">
              <span class="text-lg ${m.won ? 'text-green-400' : 'text-red-400'}">${m.won ? 'W' : 'L'}</span>
              <span class="text-white">vs ${m.opponent_name}</span>
              <span class="badge text-xs ${getMatchTypeBadge(m.match_type)}">${getMatchTypeLabel(m.match_type)}</span>
            </div>
            <div class="text-right">
              <span class="font-game text-lg">${m.player_score} - ${m.opponent_score}</span>
              ${m.played_at ? `<div class="text-white/60 text-xs">${formatDate(m.played_at)}</div>` : ''}
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
        <h2 class="font-game text-xl text-yellow-500 mb-4">🏆 ${t('dashboard.leaderboard')}</h2>
        <p class="text-white/60 text-center py-4">${t('dashboard.noPlayers')}</p>
      </div>
    `;
    return;
  }

  const { leaderboard } = result.data;

  container.innerHTML = `
    <div class="card">
      <h2 class="font-game text-xl text-yellow-500 mb-4">🏆 ${t('dashboard.leaderboard')}</h2>
      <div class="space-y-2">
        ${leaderboard.map((p, i) => `
          <a href="/profile/${p.user_id}" data-link class="flex items-center gap-3 p-2 rounded-lg ${i < 3 ? 'bg-pong-darker' : ''} hover:bg-white/5 transition-colors">
            <span class="font-game text-lg w-8 ${getRankColor(i + 1)}">${getRankDisplay(i + 1)}</span>
            <img src="${p.avatar_url || '/default-avatar.png'}" alt="" class="w-8 h-8 rounded-full">
            <div class="flex-1">
              <div class="text-white text-sm">${p.display_name}</div>
              <div class="text-white/60 text-xs">${p.wins}W - ${p.losses}L</div>
            </div>
            <span class="font-game text-sm ${p.win_rate >= 50 ? 'text-green-400' : 'text-white/80'}">${p.win_rate}%</span>
          </a>
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
    case 'local': return 'bg-green-500/20 text-green-400';
    case 'online': return 'bg-cyan-500/20 text-cyan-400';
    default: return 'bg-gray-500/20 text-white/80';
  }
}

function getMatchTypeLabel(type: string): string {
  return t(`dashboard.matchTypes.${type}`) || type;
}

function formatDate(dateStr: string): string {
  // SQLite returns UTC timestamps without timezone info
  // Convert to ISO format if needed
  let date: Date;
  if (dateStr && !dateStr.includes('Z') && !dateStr.includes('+')) {
    const isoDate = dateStr.replace(' ', 'T') + 'Z';
    date = new Date(isoDate);
  } else {
    date = new Date(dateStr);
  }
  return date.toLocaleDateString();
}

function getRankColor(rank: number): string {
  switch (rank) {
    case 1: return 'text-yellow-400';
    case 2: return 'text-white';
    case 3: return 'text-amber-600';
    default: return 'text-white/60';
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

//Render a pie chart using SVG

function renderPieChart(wins: number, losses: number): string {
  const total = wins + losses;

  // No data case
  if (total === 0) {
    return `
      <svg viewBox="0 0 200 200" class="w-full h-full">
        <circle cx="100" cy="100" r="80" fill="#374151" />
        <circle cx="100" cy="100" r="50" fill="#0f172a" />
        <text x="100" y="100" text-anchor="middle" dominant-baseline="middle" class="fill-white/60" style="font-size: 14px;">${t('dashboard.noData')}</text>
      </svg>
    `;
  }

  // All wins - full green circle
  if (losses === 0) {
    return `
      <svg viewBox="0 0 200 200" class="w-full h-full">
        <circle cx="100" cy="100" r="80" fill="#10b981" />
        <circle cx="100" cy="100" r="50" fill="#0f172a" />
        <text x="100" y="100" text-anchor="middle" dominant-baseline="middle" class="fill-green-400 font-game" style="font-size: 20px;">${wins}W</text>
      </svg>
    `;
  }

  // All losses - full red circle
  if (wins === 0) {
    return `
      <svg viewBox="0 0 200 200" class="w-full h-full">
        <circle cx="100" cy="100" r="80" fill="#ef4444" />
        <circle cx="100" cy="100" r="50" fill="#0f172a" />
        <text x="100" y="100" text-anchor="middle" dominant-baseline="middle" class="fill-red-400 font-game" style="font-size: 20px;">${losses}L</text>
      </svg>
    `;
  }

  // Mixed wins and losses - draw pie chart
  const winPercentage = wins / total;

  // Helper function to calculate point on circle
  function getCoordinatesForPercent(percent: number): { x: number; y: number } {
    const angle = 2 * Math.PI * (percent - 0.25); // -0.25 to start from top
    return {
      x: Math.cos(angle),
      y: Math.sin(angle)
    };
  }

  // Create pie slice path
  function createSlicePath(startPercent: number, endPercent: number, radius: number): string {
    const start = getCoordinatesForPercent(startPercent);
    const end = getCoordinatesForPercent(endPercent);
    const largeArcFlag = (endPercent - startPercent) > 0.5 ? 1 : 0;

    return [
      `M 100 100`,
      `L ${100 + start.x * radius} ${100 + start.y * radius}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${100 + end.x * radius} ${100 + end.y * radius}`,
      'Z'
    ].join(' ');
  }

  const winsPath = createSlicePath(0, winPercentage, 80);
  const lossesPath = createSlicePath(winPercentage, 1, 80);

  return `
    <svg viewBox="0 0 200 200" class="w-full h-full">
      <!-- Wins slice (green) -->
      <path d="${winsPath}" fill="#10b981" />
      
      <!-- Losses slice (red) -->
      <path d="${lossesPath}" fill="#ef4444" />
      
      <!-- Center circle (to make it a donut) -->
      <circle cx="100" cy="100" r="50" fill="#0f172a" />
      
      <!-- Center text showing total -->
      <text 
        x="100" 
        y="95" 
        text-anchor="middle" 
        dominant-baseline="middle" 
        class="fill-white font-game"
        style="font-size: 22px;"
      >
        ${wins}W - ${losses}L
      </text>
      <text 
        x="100" 
        y="115" 
        text-anchor="middle" 
        dominant-baseline="middle" 
        class="fill-white/60"
        style="font-size: 12px;"
      >
        ${total} ${t('dashboard.games')}
      </text>
    </svg>
  `;
}
