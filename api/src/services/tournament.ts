/**
 * Tournament Service
 * Handles tournament logic, bracket generation, and matchmaking
 */

import db from '../db/index.js';

export interface Tournament {
	id: number;
	name: string;
	status: 'pending' | 'active' | 'completed' | 'cancelled';
	max_players: number;
	current_round: number;
	created_by: number | null;
	winner_id: number | null;
	started_at: string | null;
	ended_at: string | null;
	created_at: string;
}

export interface TournamentParticipant {
	id: number;
	tournament_id: number;
	user_id: number | null;
	alias: string;
	seed: number | null;
	final_position: number | null;
	is_eliminated: boolean;
	created_at: string;
}

export interface TournamentMatch {
	id: number;
	tournament_id: number;
	tournament_round: number;
	tournament_match_number: number;
	player1_id: number | null;
	player2_id: number | null;
	player1_alias: string | null;
	player2_alias: string | null;
	player1_score: number;
	player2_score: number;
	winner_id: number | null;
	status: 'pending' | 'playing' | 'completed' | 'cancelled';
}

/**
 * Create a new tournament
 */
export function createTournament(name: string, maxPlayers: number, createdBy?: number): Tournament {
	const stmt = db.prepare(`
    INSERT INTO tournaments (name, max_players, created_by)
    VALUES (?, ?, ?)
  `);
	const result = stmt.run(name, maxPlayers, createdBy || null);

	return getTournamentById(result.lastInsertRowid as number)!;
}

/**
 * Get tournament by ID
 */
export function getTournamentById(id: number): Tournament | null {
	const stmt = db.prepare('SELECT * FROM tournaments WHERE id = ?');
	return stmt.get(id) as Tournament | null;
}

/**
 * Get all tournaments
 */
export function getAllTournaments(status?: string): Tournament[] {
	if (status) {
		const stmt = db.prepare('SELECT * FROM tournaments WHERE status = ? ORDER BY created_at DESC');
		return stmt.all(status) as Tournament[];
	}
	const stmt = db.prepare('SELECT * FROM tournaments ORDER BY created_at DESC');
	return stmt.all() as Tournament[];
}

/**
 * Join tournament with alias
 */
export function joinTournament(tournamentId: number, alias: string, userId?: number): TournamentParticipant | null {
	const tournament = getTournamentById(tournamentId);
	if (!tournament || tournament.status !== 'pending') {
		return null;
	}

	// Check if tournament is full
	const participants = getParticipants(tournamentId);
	if (participants.length >= tournament.max_players) {
		return null;
	}

	// Check if alias is taken
	const aliasExists = participants.some(p => p.alias.toLowerCase() === alias.toLowerCase());
	if (aliasExists) {
		return null;
	}

	// Check if user already joined
	if (userId) {
		const userJoined = participants.some(p => p.user_id === userId);
		if (userJoined) {
			return null;
		}
	}

	const stmt = db.prepare(`
    INSERT INTO tournament_participants (tournament_id, user_id, alias, seed)
    VALUES (?, ?, ?, ?)
  `);
	const seed = participants.length + 1;
	const result = stmt.run(tournamentId, userId || null, alias, seed);

	return {
		id: result.lastInsertRowid as number,
		tournament_id: tournamentId,
		user_id: userId || null,
		alias,
		seed,
		final_position: null,
		is_eliminated: false,
		created_at: new Date().toISOString(),
	};
}

/**
 * Get tournament participants
 */
export function getParticipants(tournamentId: number): TournamentParticipant[] {
	const stmt = db.prepare('SELECT * FROM tournament_participants WHERE tournament_id = ? ORDER BY seed');
	return stmt.all(tournamentId) as TournamentParticipant[];
}

/**
 * Start tournament and generate bracket
 */
export function startTournament(tournamentId: number): boolean {
	const tournament = getTournamentById(tournamentId);
	if (!tournament || tournament.status !== 'pending') {
		return false;
	}

	const participants = getParticipants(tournamentId);
	if (participants.length < 2) {
		return false;
	}

	// Generate bracket (single elimination)
	generateBracket(tournamentId, participants);

	// Update tournament status
	const stmt = db.prepare(`
    UPDATE tournaments 
    SET status = 'active', current_round = 1, started_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
	stmt.run(tournamentId);

	return true;
}

/**
 * Generate single elimination bracket
 */
function generateBracket(tournamentId: number, participants: TournamentParticipant[]): void {
	// Shuffle participants for random matchups
	const shuffled = [...participants].sort(() => Math.random() - 0.5);

	// Calculate rounds needed
	const numPlayers = shuffled.length;
	const totalRounds = Math.ceil(Math.log2(numPlayers));

	// First round matches
	let matchNumber = 1;
	for (let i = 0; i < shuffled.length; i += 2) {
		const player1 = shuffled[i];
		const player2 = shuffled[i + 1]; // Might be undefined (bye)

		const stmt = db.prepare(`
      INSERT INTO matches (
        tournament_id, tournament_round, tournament_match_number,
        player1_id, player2_id, player1_alias, player2_alias,
        match_type, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'tournament', ?)
    `);

		if (player2) {
			stmt.run(
				tournamentId, 1, matchNumber,
				player1.user_id, player2.user_id,
				player1.alias, player2.alias,
				'pending'
			);
		} else {
			// Bye - player1 auto-advances
			stmt.run(
				tournamentId, 1, matchNumber,
				player1.user_id, null,
				player1.alias, null,
				'completed'
			);
			// Record as winner
			const matchStmt = db.prepare(`
        UPDATE matches SET winner_id = ?, player1_score = 5, player2_score = 0
        WHERE tournament_id = ? AND tournament_round = ? AND tournament_match_number = ?
      `);
			matchStmt.run(player1.user_id, tournamentId, 1, matchNumber);
		}
		matchNumber++;
	}

	// Create placeholder matches for future rounds
	let matchesInRound = Math.ceil(numPlayers / 2);
	for (let round = 2; round <= totalRounds; round++) {
		matchesInRound = Math.ceil(matchesInRound / 2);
		for (let m = 1; m <= matchesInRound; m++) {
			const stmt = db.prepare(`
        INSERT INTO matches (
          tournament_id, tournament_round, tournament_match_number,
          match_type, status
        ) VALUES (?, ?, ?, 'tournament', 'pending')
      `);
			stmt.run(tournamentId, round, m);
		}
	}
}

/**
 * Get tournament matches
 */
export function getTournamentMatches(tournamentId: number): TournamentMatch[] {
	const stmt = db.prepare(`
    SELECT * FROM matches 
    WHERE tournament_id = ? 
    ORDER BY tournament_round, tournament_match_number
  `);
	return stmt.all(tournamentId) as TournamentMatch[];
}

/**
 * Get current match (next pending match)
 */
export function getCurrentMatch(tournamentId: number): TournamentMatch | null {
	const stmt = db.prepare(`
    SELECT * FROM matches 
    WHERE tournament_id = ? AND status = 'pending' AND player1_alias IS NOT NULL
    ORDER BY tournament_round, tournament_match_number
    LIMIT 1
  `);
	return stmt.get(tournamentId) as TournamentMatch | null;
}

/**
 * Record match result
 */
export function recordMatchResult(
	matchId: number,
	player1Score: number,
	player2Score: number
): boolean {
	const matchStmt = db.prepare('SELECT * FROM matches WHERE id = ?');
	const match = matchStmt.get(matchId) as TournamentMatch | null;

	if (!match || match.status !== 'pending') {
		return false;
	}

	const winnerId = player1Score > player2Score ? match.player1_id : match.player2_id;
	const winnerAlias = player1Score > player2Score ? match.player1_alias : match.player2_alias;
	const loserId = player1Score > player2Score ? match.player2_id : match.player1_id;

	// Update match
	const updateStmt = db.prepare(`
    UPDATE matches 
    SET player1_score = ?, player2_score = ?, winner_id = ?, 
        status = 'completed', ended_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);
	updateStmt.run(player1Score, player2Score, winnerId, matchId);

	// Eliminate loser
	if (loserId && match.tournament_id) {
		const elimStmt = db.prepare(`
      UPDATE tournament_participants SET is_eliminated = 1
      WHERE tournament_id = ? AND user_id = ?
    `);
		elimStmt.run(match.tournament_id, loserId);
	}

	// Advance winner to next round
	if (match.tournament_id) {
		advanceWinner(match.tournament_id, match.tournament_round!, match.tournament_match_number!, winnerId, winnerAlias);
	}

	return true;
}

/**
 * Advance winner to next round
 */
function advanceWinner(
	tournamentId: number,
	currentRound: number,
	currentMatchNumber: number,
	winnerId: number | null,
	winnerAlias: string | null
): void {
	const nextRound = currentRound + 1;
	const nextMatchNumber = Math.ceil(currentMatchNumber / 2);

	// Check if next round match exists
	const checkStmt = db.prepare(`
    SELECT * FROM matches 
    WHERE tournament_id = ? AND tournament_round = ? AND tournament_match_number = ?
  `);
	const nextMatch = checkStmt.get(tournamentId, nextRound, nextMatchNumber) as TournamentMatch | null;

	if (!nextMatch) {
		// Tournament complete - this was the final
		const tournament = getTournamentById(tournamentId);
		if (tournament) {
			const finalStmt = db.prepare(`
        UPDATE tournaments 
        SET status = 'completed', winner_id = ?, ended_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
			finalStmt.run(winnerId, tournamentId);

			// Set winner's final position
			if (winnerId) {
				const posStmt = db.prepare(`
          UPDATE tournament_participants SET final_position = 1
          WHERE tournament_id = ? AND user_id = ?
        `);
				posStmt.run(tournamentId, winnerId);
			}
		}
		return;
	}

	// Determine slot (first or second player based on odd/even match number)
	const isFirstSlot = currentMatchNumber % 2 === 1;

	if (isFirstSlot) {
		const updateStmt = db.prepare(`
      UPDATE matches SET player1_id = ?, player1_alias = ?
      WHERE tournament_id = ? AND tournament_round = ? AND tournament_match_number = ?
    `);
		updateStmt.run(winnerId, winnerAlias, tournamentId, nextRound, nextMatchNumber);
	} else {
		const updateStmt = db.prepare(`
      UPDATE matches SET player2_id = ?, player2_alias = ?
      WHERE tournament_id = ? AND tournament_round = ? AND tournament_match_number = ?
    `);
		updateStmt.run(winnerId, winnerAlias, tournamentId, nextRound, nextMatchNumber);
	}

	// Check if next match is ready to play (both players set)
	const readyStmt = db.prepare(`
    SELECT * FROM matches 
    WHERE tournament_id = ? AND tournament_round = ? AND tournament_match_number = ?
    AND player1_alias IS NOT NULL AND player2_alias IS NOT NULL
  `);
	const readyMatch = readyStmt.get(tournamentId, nextRound, nextMatchNumber);

	if (readyMatch) {
		// Update tournament current round
		const roundStmt = db.prepare(`
      UPDATE tournaments SET current_round = ? WHERE id = ? AND current_round < ?
    `);
		roundStmt.run(nextRound, tournamentId, nextRound);
	}
}

/**
 * Get tournament bracket for display
 */
export function getBracket(tournamentId: number) {
	const matches = getTournamentMatches(tournamentId);
	const participants = getParticipants(tournamentId);
	const tournament = getTournamentById(tournamentId);

	// Group by round
	const rounds: Record<number, TournamentMatch[]> = {};
	for (const match of matches) {
		const round = match.tournament_round;
		if (!rounds[round]) rounds[round] = [];
		rounds[round].push(match);
	}

	return {
		tournament,
		participants,
		rounds,
		totalRounds: Object.keys(rounds).length,
	};
}
