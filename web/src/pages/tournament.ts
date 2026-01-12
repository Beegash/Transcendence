/**
 * Tournament Page
 */

import { t } from '../i18n';
import { renderNavbar } from '../components/navbar';

export function renderTournamentPage(): void {
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
    <div class="max-w-5xl mx-auto px-4 py-8">
      <h1 class="font-game text-3xl text-center text-gradient mb-8">${t('nav.tournament')}</h1>
      
      <!-- Create Tournament -->
      <div class="card mb-8">
        <h2 class="font-game text-xl text-pong-primary mb-4">Create Tournament</h2>
        <form id="create-tournament-form" class="space-y-4">
          <div>
            <label class="block text-sm text-gray-400 mb-2">Tournament Name</label>
            <input type="text" name="name" class="input" placeholder="Epic Pong Championship" required>
          </div>
          <div>
            <label class="block text-sm text-gray-400 mb-2">Max Players</label>
            <select name="maxPlayers" class="input">
              <option value="4">4 Players</option>
              <option value="8" selected>8 Players</option>
              <option value="16">16 Players</option>
            </select>
          </div>
          <button type="submit" class="btn btn-primary">Create Tournament</button>
        </form>
      </div>
      
      <!-- Active Tournaments -->
      <h2 class="font-game text-xl text-pong-primary mb-4">Active Tournaments</h2>
      <div class="grid md:grid-cols-2 gap-6 mb-8">
        <div class="card-hover">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-game text-lg">Friday Night Pong</h3>
            <span class="badge bg-green-500/20 text-green-400">In Progress</span>
          </div>
          <div class="text-gray-500 text-sm mb-4">
            <p>6/8 players • Round 2 of 3</p>
            <p>Created by: Admin</p>
          </div>
          <button class="btn btn-secondary w-full">Spectate</button>
        </div>
        
        <div class="card-hover">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-game text-lg">Beginner's Cup</h3>
            <span class="badge bg-yellow-500/20 text-yellow-400">Waiting</span>
          </div>
          <div class="text-gray-500 text-sm mb-4">
            <p>3/4 players • Waiting for players</p>
            <p>Created by: NewPlayer42</p>
          </div>
          <button class="btn btn-primary w-full">Join Tournament</button>
        </div>
      </div>
      
      <!-- Tournament Bracket -->
      <h2 class="font-game text-xl text-pong-primary mb-4">Tournament Bracket</h2>
      <div class="card overflow-x-auto">
        <div class="min-w-[600px] p-4">
          <!-- Simple 4-player bracket visualization -->
          <div class="flex justify-between items-center">
            <!-- Round 1 -->
            <div class="space-y-8">
              <div class="card bg-pong-dark p-3 w-40">
                <div class="flex justify-between items-center border-b border-pong-light pb-2 mb-2">
                  <span>Player1</span>
                  <span class="font-game text-pong-primary">11</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-500">Player2</span>
                  <span class="font-game text-gray-500">5</span>
                </div>
              </div>
              <div class="card bg-pong-dark p-3 w-40">
                <div class="flex justify-between items-center border-b border-pong-light pb-2 mb-2">
                  <span class="text-gray-500">Player3</span>
                  <span class="font-game text-gray-500">7</span>
                </div>
                <div class="flex justify-between items-center">
                  <span>Player4</span>
                  <span class="font-game text-pong-primary">11</span>
                </div>
              </div>
            </div>
            
            <!-- Lines -->
            <div class="flex-1 flex items-center justify-center">
              <div class="text-gray-600">→</div>
            </div>
            
            <!-- Finals -->
            <div>
              <div class="card bg-pong-dark p-3 w-40 border-2 border-pong-primary">
                <div class="text-center text-pong-primary text-sm mb-2">FINALS</div>
                <div class="flex justify-between items-center border-b border-pong-light pb-2 mb-2">
                  <span>Player1</span>
                  <span class="font-game">-</span>
                </div>
                <div class="flex justify-between items-center">
                  <span>Player4</span>
                  <span class="font-game">-</span>
                </div>
              </div>
            </div>
            
            <!-- Lines -->
            <div class="flex-1 flex items-center justify-center">
              <div class="text-gray-600">→</div>
            </div>
            
            <!-- Winner -->
            <div>
              <div class="card bg-pong-dark p-3 w-40 text-center">
                <div class="text-yellow-500 text-2xl mb-2">🏆</div>
                <div class="text-gray-500">Winner</div>
                <div class="font-game text-lg">TBD</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}
