/**
 * Tournament Page
 * Dynamic tournament list, creation, joining, and bracket display
 */

import { t } from '../i18n';
import { renderNavbar } from '../components/navbar';
import api from '../utils/api';
import { router } from '../utils/router';

interface Tournament {
  id: number;
  name: string;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  max_players: number;
  current_round: number;
  created_at: string;
}

interface Participant {
  id: number;
  alias: string;
  is_eliminated: boolean;
}

interface Match {
  id: number;
  tournament_round: number;
  tournament_match_number: number;
  player1_alias: string | null;
  player2_alias: string | null;
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

export async function renderTournamentPage(): Promise<void> {
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
        <h2 class="font-game text-xl text-pong-primary mb-4">Create Tournament</h2>
        <form id="create-tournament-form" class="flex flex-wrap gap-4 items-end">
          <div class="flex-1 min-w-[200px]">
            <label class="block text-sm text-gray-400 mb-2">Tournament Name</label>
            <input type="text" name="name" class="input" placeholder="Epic Pong Championship" required>
          </div>
          <div class="w-32">
            <label class="block text-sm text-gray-400 mb-2">Max Players</label>
            <select name="maxPlayers" class="input">
              <option value="4">4</option>
              <option value="8" selected>8</option>
              <option value="16">16</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary">Create</button>
        </form>
        <div id="create-error" class="hidden mt-2 text-red-400 text-sm"></div>
      </div>
      
      <!-- Tournament List -->
      <div id="tournament-list" class="space-y-4">
        <div class="text-center text-gray-500">Loading tournaments...</div>
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
      <div class="text-center text-gray-500 py-8">
        No tournaments yet. Create one to get started!
      </div>
    `;
    return;
  }

  const tournaments = result.data.tournaments;

  listDiv.innerHTML = `
    <div class="grid md:grid-cols-2 gap-6">
      ${tournaments.map(t => `
        <div class="card-hover cursor-pointer" data-tournament-id="${t.id}">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-game text-lg">${t.name}</h3>
            <span class="badge ${getStatusBadgeClass(t.status)}">${getStatusLabel(t.status)}</span>
          </div>
          <div class="text-gray-500 text-sm mb-4">
            <p>Max ${t.max_players} players</p>
            <p>Created ${new Date(t.created_at).toLocaleDateString()}</p>
          </div>
          <button class="btn ${t.status === 'pending' ? 'btn-primary' : 'btn-secondary'} w-full view-btn" data-id="${t.id}">
            ${t.status === 'pending' ? 'Join' : 'View'}
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
  content.innerHTML = `
    <div class="max-w-5xl mx-auto px-4 py-8">
      <div class="text-center text-gray-500">Loading tournament...</div>
    </div>
  `;

  const result = await api.get<{ tournament: Tournament; participants: Participant[] }>(`/tournaments/${id}`);

  if (!result.success || !result.data) {
    content.innerHTML = `
      <div class="max-w-5xl mx-auto px-4 py-8 text-center">
        <h1 class="font-game text-2xl text-red-500 mb-4">Tournament Not Found</h1>
        <button class="btn btn-secondary" id="back-btn">Back to Tournaments</button>
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
        <button class="btn btn-secondary text-sm" id="back-btn">← Back</button>
        <h1 class="font-game text-2xl text-gradient">${tournament.name}</h1>
        <span class="badge ${getStatusBadgeClass(tournament.status)}">${getStatusLabel(tournament.status)}</span>
      </div>
      
      <!-- Join Section -->
      ${canJoin ? `
        <div class="card mb-6">
          <h2 class="font-game text-lg text-pong-primary mb-4">Join Tournament</h2>
          <form id="join-form" class="flex gap-4">
            <input type="text" name="alias" class="input flex-1" placeholder="Your alias (e.g. ProGamer)" maxlength="20" required>
            <button type="submit" class="btn btn-primary">Join</button>
          </form>
          <div id="join-error" class="hidden mt-2 text-red-400 text-sm"></div>
        </div>
      ` : ''}
      
      <!-- Start Button (creator only, when enough players) -->
      ${isPending && participants.length >= 2 ? `
        <div class="text-center mb-6">
          <button id="start-btn" class="btn btn-primary btn-lg">Start Tournament (${participants.length} players)</button>
        </div>
      ` : ''}
      
      <!-- Participants -->
      <div class="card mb-6">
        <h2 class="font-game text-lg text-pong-primary mb-4">
          Participants (${participants.length}/${tournament.max_players})
        </h2>
        <div class="flex flex-wrap gap-2">
          ${participants.map(p => `
            <span class="badge ${p.is_eliminated ? 'bg-red-500/20 text-red-400 line-through' : 'bg-pong-primary/20 text-pong-primary'}">
              ${p.alias}
            </span>
          `).join('')}
          ${participants.length === 0 ? '<span class="text-gray-500">No participants yet</span>' : ''}
        </div>
      </div>
      
      <!-- Bracket (if active or completed) -->
      ${isActive || tournament.status === 'completed' ? `
        <div id="bracket-container">
          <h2 class="font-game text-lg text-pong-primary mb-4">Bracket</h2>
          <div class="text-center text-gray-500">Loading bracket...</div>
        </div>
      ` : ''}
    </div>
  `;

  // Event handlers
  document.getElementById('back-btn')?.addEventListener('click', () => router.navigate('/tournament'));

  document.getElementById('join-form')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const form = e.target as HTMLFormElement;
    const alias = (form.alias as HTMLInputElement).value.trim();

    const result = await api.post(`/tournaments/${id}/join`, { alias });

    if (result.success) {
      await renderTournamentDetail(content, id);
    } else {
      const errorDiv = document.getElementById('join-error')!;
      errorDiv.textContent = result.error || 'Failed to join';
      errorDiv.classList.remove('hidden');
    }
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

  // Build bracket HTML
  let bracketHTML = '<div class="overflow-x-auto"><div class="flex gap-8 p-4 min-w-max">';

  for (let round = 1; round <= totalRounds; round++) {
    const matches = rounds[round] || [];
    const roundName = round === totalRounds ? 'FINAL' : round === totalRounds - 1 ? 'SEMI' : `R${round}`;

    bracketHTML += `
      <div class="space-y-4">
        <div class="text-center text-gray-500 text-sm font-game">${roundName}</div>
        ${matches.map(m => `
          <div class="card bg-pong-dark p-3 w-44 ${m.status === 'pending' && m.player1_alias && m.player2_alias ? 'border-2 border-yellow-500' : ''}">
            <div class="flex justify-between items-center border-b border-pong-light pb-2 mb-2">
              <span class="${m.player1_score > m.player2_score && m.status === 'completed' ? 'text-pong-primary font-bold' : 'text-gray-400'}">
                ${m.player1_alias || 'TBD'}
              </span>
              <span class="font-game ${m.player1_score > m.player2_score ? 'text-pong-primary' : ''}">${m.status === 'completed' ? m.player1_score : '-'}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="${m.player2_score > m.player1_score && m.status === 'completed' ? 'text-pong-primary font-bold' : 'text-gray-400'}">
                ${m.player2_alias || 'TBD'}
              </span>
              <span class="font-game ${m.player2_score > m.player1_score ? 'text-pong-primary' : ''}">${m.status === 'completed' ? m.player2_score : '-'}</span>
            </div>
            ${m.status === 'pending' && m.player1_alias && m.player2_alias ? `
          <button class="btn btn-primary text-xs w-full mt-2 play-match-btn" 
            data-match-id="${m.id}"
            data-p1="${m.player1_alias}"
            data-p2="${m.player2_alias}"
          >Play Match</button>
            ` : ''}
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
          <div class="text-gray-500 text-sm">CHAMPION</div>
          <div class="font-game text-lg text-pong-primary">${winnerAlias || 'TBD'}</div>
        </div>
      </div>
    `;
  }

  bracketHTML += '</div></div>';
  container.innerHTML = bracketHTML;

  // Play match buttons - navigate to game page
  container.querySelectorAll('.play-match-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const matchId = (btn as HTMLElement).dataset.matchId;
      const p1 = (btn as HTMLElement).dataset.p1;
      const p2 = (btn as HTMLElement).dataset.p2;

      router.navigate(`/game?mode=tournament&tournamentId=${tournamentId}&matchId=${matchId}&p1=${p1}&p2=${p2}`);
    });
  });
}

function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'pending': return 'bg-yellow-500/20 text-yellow-400';
    case 'active': return 'bg-green-500/20 text-green-400';
    case 'completed': return 'bg-blue-500/20 text-blue-400';
    default: return 'bg-gray-500/20 text-gray-400';
  }
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'Waiting';
    case 'active': return 'In Progress';
    case 'completed': return 'Completed';
    default: return status;
  }
}
