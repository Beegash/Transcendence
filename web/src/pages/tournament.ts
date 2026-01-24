// Tournament Page
// Dynamic tournament list, creation, joining, and bracket display

import { t } from '../i18n';
import { renderNavbar } from '../components/navbar';
import api from '../utils/api';
import { router } from '../utils/router';
import { gameSocket } from '../utils/gameSocket';
import { auth } from '../utils/auth';

interface Tournament {
  id: number;
  name: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  max_players: number;
  created_by: number;
  current_round: number;
  created_at: string;
}

interface Participant {
  id: number;
  user_id: number;
  alias: string;
  is_eliminated: boolean;
}

interface Match {
  id: number;
  tournament_round: number;
  tournament_match_number: number;
  player1_alias: string | null;
  player2_alias: string | null;
  player1_id: number | null;
  player2_id: number | null;
  player1_score: number;
  player2_score: number;
  status: string;
}

interface Bracket {
  tournament: Tournament;
  participants: Participant[];
  rounds: Record<number, Match[]>;
  totalRounds: number;
}

let currentTournament: Tournament | null = null;
let tournamentCleanup: (() => void)[] = [];

function cleanup(): void {
  tournamentCleanup.forEach(cb => cb());
  tournamentCleanup = [];
}

export async function renderTournamentPage(): Promise<void> {
  cleanup();
  renderNavbar();

  const app = document.getElementById('app');
  if (!app) return;

  let content = document.getElementById('page-content');
  if (!content) {
    content = document.createElement('div');
    content.id = 'page-content';
    app.appendChild(content);
  }

  // Check if viewing a specific tournament
  const params = router.getParams('/tournament/:id');
  if (params.id) {
    await renderTournamentDetail(content, parseInt(params.id));
    return;
  }

  await renderTournamentList(content);
}

async function renderTournamentList(content: HTMLElement): Promise<void> {
  content.innerHTML = `
    <div class="max-w-5xl mx-auto px-4 py-8">
      <h1 class="font-game text-3xl text-center text-gradient mb-8">${t('nav.tournament')}</h1>
      
      <!-- Create Tournament -->
      <div class="card mb-8">
        <h2 class="font-game text-xl text-pong-primary mb-4">${t('tournament.createTournament')}</h2>
        <form id="create-tournament-form" class="flex flex-wrap gap-4 items-end">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm text-white/80 mb-2">${t('tournament.tournamentName')}</label>
            <input type="text" name="name" class="input" placeholder="Epic Pong Championship" required>
          </div>
          <div class="w-32">
            <label class="block text-sm text-white/80 mb-2">${t('tournament.maxPlayers')}</label>
            <select name="maxPlayers" class="input">
              <option value="4">4</option>
              <option value="8" selected>8</option>
              <option value="16">16</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary">${t('tournament.create')}</button>
        </form>
        <div id="create-error" class="hidden mt-2 text-red-400 text-sm"></div>
      </div>
      
      <!-- Tournament List -->
      <div id="tournament-list" class="space-y-4">
        <div class="text-center text-white/60">${t('tournament.loadingTournaments')}</div>
      </div>
    </div>
  `;

  // Load tournaments
  await loadTournaments();

  // Create tournament form
  document.getElementById('create-tournament-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    const name = formData.get('name') as string;
    const maxPlayers = parseInt(formData.get('maxPlayers') as string);

    const result = await api.post<{ tournament: Tournament }>('/tournaments', { name, maxPlayers });

    if (result.success && result.data) {
      form.reset();
      await loadTournaments();
    } else {
      const errorDiv = document.getElementById('create-error')!;
      errorDiv.textContent = result.error || 'Failed to create tournament';
      errorDiv.classList.remove('hidden');
    }
  });
}

async function loadTournaments(): Promise<void> {
  const listDiv = document.getElementById('tournament-list');
  if (!listDiv) return;

  const result = await api.get<{ tournaments: Tournament[] }>('/tournaments');

  if (!result.success || !result.data?.tournaments.length) {
    listDiv.innerHTML = `
      <div class="text-center text-white/60 py-8">
        ${t('tournament.noTournamentsYet')}
      </div>
    `;
    return;
  }

  const tournaments = result.data.tournaments;

  listDiv.innerHTML = `
    <div class="grid md:grid-cols-2 gap-6">
      ${tournaments.map(tournament => `
        <div class="card-hover cursor-pointer" data-tournament-id="${tournament.id}">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-game text-lg">${tournament.name}</h3>
            <span class="badge ${getStatusBadgeClass(tournament.status)}">${getStatusLabel(tournament.status)}</span>
          </div>
          <div class="text-white/60 text-sm mb-4">
            <p>${t('tournament.maxPlayersInfo', { count: tournament.max_players.toString() })}</p>
            <p>${t('tournament.createdOn')} ${new Date(tournament.created_at).toLocaleDateString()}</p>
          </div>
          <button class="btn ${tournament.status === 'pending' ? 'btn-primary' : 'btn-secondary'} w-full view-btn" data-id="${tournament.id}">
            ${tournament.status === 'pending' ? t('tournament.join') : t('tournament.view')}
          </button>
        </div>
      `).join('')}
    </div>
  `;

  // Add click handlers
  listDiv.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const id = (btn as HTMLElement).dataset.id;
      router.navigate(`/tournament/${id}`);
    });
  });
}

async function renderTournamentDetail(content: HTMLElement, id: number): Promise<void> {
  cleanup();
  content.innerHTML = `
    <div class="max-w-5xl mx-auto px-4 py-8">
      <div class="text-center text-white/60">Loading tournament...</div>
    </div>
  `;

  const result = await api.get<{ tournament: Tournament; participants: Participant[] }>(`/tournaments/${id}`);

  if (!result.success || !result.data) {
    content.innerHTML = `
      <div class="max-w-5xl mx-auto px-4 py-8 text-center">
        <h1 class="font-game text-2xl text-red-500 mb-4">Tournament Not Found</h1>
        <button class="btn btn-secondary" id="back-btn">${t('tournament.backToTournaments')}</button>
      </div>
    `;
    document.getElementById('back-btn')?.addEventListener('click', () => router.navigate('/tournament'));
    return;
  }

  const { tournament, participants } = result.data;
  currentTournament = tournament;

  const isPending = tournament.status === 'pending';
  const isActive = tournament.status === 'active';
  const canJoin = isPending && participants.length < tournament.max_players;

  content.innerHTML = `
    <div class="max-w-5xl mx-auto px-4 py-8">
      <div class="flex items-center justify-between mb-6">
        <button class="btn btn-secondary text-sm" id="back-btn">${t('tournament.back')}</button>
        <h1 class="font-game text-2xl text-gradient">${tournament.name}</h1>
        <span class="badge ${getStatusBadgeClass(tournament.status)}">${getStatusLabel(tournament.status)}</span>
      </div>
      
      <!-- Join Section -->
      ${canJoin ? `
        <div class="card mb-6">
          <h2 class="font-game text-lg text-pong-primary mb-4">${t('tournament.join')}</h2>
          <form id="join-form">
            <p class="text-white/80 mb-4">${t('tournament.clickToJoin')} <span class="text-pong-secondary">${localStorage.getItem('username') || t('tournament.yourself')}</span>.</p>
            <button type="submit" class="btn btn-primary w-full">${t('tournament.join')}</button>
          </form>
          <div id="join-error" class="hidden mt-2 text-red-400 text-sm"></div>
        </div>
      ` : ''}
      
      <!-- Start Button (creator only, when enough players) -->
      ${isPending && participants.length >= 2 ? `
        <div class="text-center mb-6">
          <button id="start-btn" class="btn btn-primary btn-lg">${t('tournament.startWithPlayers', { count: participants.length.toString() })}</button>
        </div>
      ` : ''}
      
      <!-- Participants -->
      <div class="card mb-6">
        <h2 class="font-game text-lg text-pong-primary mb-4">
          ${t('tournament.participants')} (${participants.length}/${tournament.max_players})
        </h2>
        <div class="flex flex-wrap gap-2">
          ${participants.map(p => {
    const currentUser = auth.getUser();
    const isCreator = tournament.created_by === currentUser?.id;
    const isSelf = p.user_id === currentUser?.id;

    return `
                <div class="flex items-center gap-2 bg-pong-darker p-2 rounded-lg border border-pong-light/20">
                  <span class="badge ${p.is_eliminated ? 'bg-red-500/20 text-red-400 line-through' : 'bg-pong-primary/20 text-pong-primary'}">
                    ${p.alias}
                  </span>
                  ${isCreator && isPending && !isSelf ? `
                    <button class="text-red-500 hover:text-red-400 p-1 kick-btn" data-user-id="${p.user_id}" title="${t('tournament.kickParticipant')}">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 16 16">
                        <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                      </svg>
                    </button>
                  ` : ''}
                </div>
              `;
  }).join('')}
          ${participants.length === 0 ? `<span class="text-white/60">${t('tournament.noParticipants')}</span>` : ''}
        </div>
      </div>
      
      <!-- Bracket (if active or completed) -->
      ${isActive || tournament.status === 'completed' ? `
        <div id="bracket-container">
          <h2 class="font-game text-lg text-pong-primary mb-4">${t('tournament.bracket')}</h2>
          <div class="text-center text-white/60">${t('tournament.loadingBracket')}</div>
        </div>
      ` : ''}
    </div>
  `;

  // Event handlers
  document.getElementById('back-btn')?.addEventListener('click', () => router.navigate('/tournament'));

  document.getElementById('join-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();

    const result = await api.post(`/tournaments/${id}/join`, {});

    if (result.success) {
      await renderTournamentDetail(content, id);
    } else {
      const errorDiv = document.getElementById('join-error')!;
      errorDiv.textContent = result.error || 'Failed to join';
      errorDiv.classList.remove('hidden');
    }
  });

  document.querySelectorAll('.kick-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const targetUserId = (btn as HTMLElement).dataset.userId;
      if (confirm('Are you sure you want to remove this participant?')) {
        const result = await api.delete(`/tournaments/${id}/participants/${targetUserId}`);
        if (result.success) {
          await renderTournamentDetail(content, id);
        } else {
          alert(result.error || 'Failed to remove participant');
        }
      }
    });
  });

  document.getElementById('start-btn')?.addEventListener('click', async () => {
    const result = await api.post(`/tournaments/${id}/start`, {});

    if (result.success) {
      await renderTournamentDetail(content, id);
    } else {
      alert(result.error || 'Failed to start tournament');
    }
  });

  // Load bracket if needed
  if (isActive || tournament.status === 'completed') {
    await loadBracket(id);
  }

  // WebSocket Subscription for Real-time Updates
  try {
    await gameSocket.connect();
    gameSocket.send({ type: 'subscribe_tournament', tournamentId: id });

    const unsubUpdate = gameSocket.on('tournament_update', async (data) => {
      if (data.tournamentId === id) {
        console.log('Tournament updated real-time, re-rendering...');
        // Small delay to allow DB to settle if needed
        setTimeout(() => renderTournamentDetail(content, id), 100);
      }
    });
    tournamentCleanup.push(unsubUpdate);
  } catch (err) {
    console.error('Failed to connect for real-time updates:', err);
  }
}

async function loadBracket(tournamentId: number): Promise<void> {
  const container = document.getElementById('bracket-container');
  if (!container) return;

  const result = await api.get<Bracket>(`/tournaments/${tournamentId}/bracket`);

  if (!result.success || !result.data) {
    container.innerHTML = '<div class="text-red-400">Failed to load bracket</div>';
    return;
  }

  const { rounds, totalRounds, tournament } = result.data;
  const currentUser = auth.getUser();
  const currentUserId = currentUser?.id || 0;
  console.log('Current User ID:', currentUserId);
  console.log('Rounds data:', rounds);

  // Build bracket HTML
  let bracketHTML = '<div class="overflow-x-auto"><div class="flex gap-8 p-4 min-w-max">';

  for (let round = 1; round <= totalRounds; round++) {
    const matches = rounds[round] || [];
    const roundName = round === totalRounds ? 'FINAL' : round === totalRounds - 1 ? 'SEMI' : `R${round}`;

    bracketHTML += `
      <div class="space-y-4">
        <div class="text-center text-white/60 text-sm font-game">${roundName}</div>
        ${matches.map(m => `
          <div class="card bg-pong-dark p-3 w-44 ${m.status === 'pending' && m.player1_alias && m.player2_alias ? 'border-2 border-yellow-500' : ''}">
            <div class="flex justify-between items-center border-b border-pong-light pb-2 mb-2">
              <span class="${m.player1_score > m.player2_score && m.status === 'completed' ? 'text-pong-primary font-bold' : 'text-white/80'}">
                ${m.player1_alias || 'TBD'}
              </span>
              <span class="font-game ${m.player1_score > m.player2_score ? 'text-pong-primary' : ''}">${m.status === 'completed' ? m.player1_score : '-'}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="${m.player2_score > m.player1_score && m.status === 'completed' ? 'text-pong-primary font-bold' : 'text-white/80'}">
                ${m.player2_alias || 'TBD'}
              </span>
              <span class="font-game ${m.player2_score > m.player1_score ? 'text-pong-primary' : ''}">${m.status === 'completed' ? m.player2_score : '-'}</span>
            </div>
            ${m.status === 'pending' && m.player1_alias && m.player2_alias ? (() => {
        const isParticipant = Number(m.player1_id) === currentUserId || Number(m.player2_id) === currentUserId;
        console.log(`Match ${m.id}: player1_id=${m.player1_id}, player2_id=${m.player2_id}, currentUserId=${currentUserId}, isParticipant=${isParticipant}`);
        if (!isParticipant) return '';
        return `
                <button class="btn btn-primary text-xs w-full mt-2 play-match-btn" 
                  data-match-id="${m.id}"
                  data-p1="${m.player1_alias}"
                  data-p2="${m.player2_alias}"
                >Play Match</button>
              `;
      })() : ''}
          </div>
        `).join('')}
      </div>
    `;
  }

  // Winner display
  if (tournament.status === 'completed') {
    const finalMatch = rounds[totalRounds]?.[0];
    const winnerAlias = finalMatch?.player1_score > finalMatch?.player2_score
      ? finalMatch?.player1_alias
      : finalMatch?.player2_alias;

    bracketHTML += `
      <div class="flex items-center">
        <div class="card bg-pong-dark p-4 w-44 text-center border-2 border-yellow-500">
          <div class="text-yellow-500 text-3xl mb-2">🏆</div>
          <div class="text-white/60 text-sm">${t('game.champion')}</div>
          <div class="font-game text-lg text-pong-primary">${winnerAlias || 'TBD'}</div>
        </div>
      </div>
    `;
  }

  bracketHTML += '</div></div>';
  container.innerHTML = bracketHTML;

  // Play match buttons - navigate to game page for online play
  container.querySelectorAll('.play-match-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const matchId = (btn as HTMLElement).dataset.matchId;

      // Use online-tournament mode
      router.navigate(`/game?mode=online-tournament&tournamentId=${tournamentId}&matchId=${matchId}`);
    });
  });
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'pending': return 'bg-yellow-500/20 text-yellow-400';
    case 'active': return 'bg-green-500/20 text-green-400';
    case 'completed': return 'bg-blue-500/20 text-blue-400';
    default: return 'bg-gray-500/20 text-white/80';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return t('tournament.waiting');
    case 'active': return t('tournament.inProgress');
    case 'completed': return t('tournament.completed');
    default: return status;
  }
}
