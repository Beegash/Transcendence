import { EventEmitter } from 'events';

class TournamentEvents extends EventEmitter { }

export const tournamentDispatcher = new TournamentEvents();

export const TOURNAMENT_UPDATED = 'tournament_updated';
