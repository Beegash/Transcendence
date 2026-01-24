/**
 * Tournament Service
 * Handles tournament logic, bracket generation, and matchmaking
 */

import db from '../db/index.js';
import { updateStatsAfterMatch } from './stats.js';

export interface Tournament {
	id: number;
	name: string;
	status: 'pending' | 'active' | 'completed' | 'cancelled';
	max_players: number;
	current_round: number;
	created_by: number; // Mandatory for tournaments
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
 * Join tournament with system username
 */
export function joinTournament(tournamentId: number, userId: number): TournamentParticipant | null {
	const tournament = getTournamentById(tournamentId);
	if (!tournament || tournament.status !== 'pending') {
		return null;
	}

	// Get user's username
	const userStmt = db.prepare('SELECT username FROM users WHERE id = ?');
	const user = userStmt.get(userId) as { username: string } | null;
	if (!user) return null;

	const alias = user.username;

	// Check if tournament is full
	const participants = getParticipants(tournamentId);
	if (participants.length >= tournament.max_players) {
		return null;
	}

	// Check if user already joined
	const userJoined = participants.some(p => p.user_id === userId);
	if (userJoined) {
		return null;
	}

	const stmt = db.prepare(`
    INSERT INTO tournament_participants (tournament_id, user_id, alias, seed)
    VALUES (?, ?, ?, ?)
  `);
	const seed = participants.length + 1;
	const result = stmt.run(tournamentId, userId, alias, seed);

	return {
		id: result.lastInsertRowid as number,
		tournament_id: tournamentId,
		user_id: userId,
		alias,
		seed,
		final_position: null,
		is_eliminated: false,
		created_at: new Date().toISOString(),
	};
}

/**
 * Remove participant from tournament
 */
export function removeParticipant(tournamentId: number, userId: number): boolean {
	const tournament = getTournamentById(tournamentId);
	if (!tournament || tournament.status !== 'pending') {
		return false;
	}

	const stmt = db.prepare('DELETE FROM tournament_participants WHERE tournament_id = ? AND user_id = ?');
	const result = stmt.run(tournamentId, userId);

	return result.changes > 0;
}

/**
 * Get tournament participants with current usernames
 */
export function getParticipants(tournamentId: number): TournamentParticipant[] {
	// Join with users table to get current username instead of cached alias
	const stmt = db.prepare(`
		SELECT tp.*, u.username as current_username
		FROM tournament_participants tp
		LEFT JOIN users u ON tp.user_id = u.id
		WHERE tp.tournament_id = ?
		ORDER BY tp.seed
	`);
	const participants = stmt.all(tournamentId) as (TournamentParticipant & { current_username?: string })[];

	// Override alias with current username if user exists
	return participants.map(p => ({
		...p,
		alias: p.current_username || p.alias
	}));
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

	// Track bye matches to process after all rounds are created
	const byeMatches: { matchNumber: number; player: TournamentParticipant }[] = [];

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
			// Bye - mark as completed but don't advance yet
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

			// Queue for advancement after all rounds are created
			byeMatches.push({ matchNumber, player: player1 });
		}
		matchNumber++;
	}

	// Create placeholder matches for future rounds FIRST
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

	// NOW process byes - all future round matches exist
	for (const bye of byeMatches) {
		advanceWinner(tournamentId, 1, bye.matchNumber, bye.player.user_id, bye.player.alias);
	}
}

/**
 * Get tournament matches with current usernames
 */
export function getTournamentMatches(tournamentId: number): TournamentMatch[] {
	// Join with users table to get current usernames instead of cached aliases
	const stmt = db.prepare(`
		SELECT m.*,
			u1.username as player1_current_username,
			u2.username as player2_current_username
		FROM matches m
		LEFT JOIN users u1 ON m.player1_id = u1.id
		LEFT JOIN users u2 ON m.player2_id = u2.id
		WHERE m.tournament_id = ?
		ORDER BY m.tournament_round, m.tournament_match_number
	`);
	const matches = stmt.all(tournamentId) as (TournamentMatch & {
		player1_current_username?: string;
		player2_current_username?: string;
	})[];

	// Override aliases with current usernames if users exist
	return matches.map(m => ({
		...m,
		player1_alias: m.player1_current_username || m.player1_alias,
		player2_alias: m.player2_current_username || m.player2_alias
	}));
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
 * Get match by ID
 */
export function getMatchById(matchId: number): TournamentMatch | null {
	const stmt = db.prepare('SELECT * FROM matches WHERE id = ?');
	return stmt.get(matchId) as TournamentMatch | null;
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

	// Update user stats
	const winnerScore = player1Score > player2Score ? player1Score : player2Score;
	const loserScore = player1Score > player2Score ? player2Score : player1Score;
	updateStatsAfterMatch(winnerId, loserId, winnerScore, loserScore);

	return true;
}

/**
 * Record tournament match forfeit (when a player disconnects)
 * This is called from RoomManager when a player disconnects during a tournament match
 */
export function recordTournamentForfeit(
	matchId: number,
	player1Score: number,
	player2Score: number
): boolean {
	// Use the same logic as recordMatchResult
	// The scores should already reflect the forfeit (WINNING_SCORE-0)
	return recordMatchResult(matchId, player1Score, player2Score);
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

	// Check if ALL matches in currentRound are completed before advancing current_round
	const pendingMatchesInRound = db.prepare(`
    SELECT COUNT(*) as count FROM matches 
    WHERE tournament_id = ? AND tournament_round = ? AND status != 'completed'
  `).get(tournamentId, currentRound) as { count: number };

	if (pendingMatchesInRound.count === 0) {
		// Update tournament current round
		const roundStmt = db.prepare(`
      UPDATE tournaments SET current_round = ? WHERE id = ? AND current_round < ?
    `);
		roundStmt.run(nextRound, tournamentId, nextRound);

		// Check for byes in next round - matches where only one player is assigned
		checkAndProcessByes(tournamentId, nextRound);
	}
}

/**
 * Check for bye scenarios in a round and auto-advance lone players
 */
function checkAndProcessByes(tournamentId: number, roundNumber: number): void {
	const matchesStmt = db.prepare(`
    SELECT * FROM matches 
    WHERE tournament_id = ? AND tournament_round = ? AND status = 'pending'
  `);
	const matches = matchesStmt.all(tournamentId, roundNumber) as TournamentMatch[];

	for (const match of matches) {
		const hasPlayer1 = match.player1_id !== null;
		const hasPlayer2 = match.player2_id !== null;

		// Bye: only one player, auto-advance them
		if (hasPlayer1 && !hasPlayer2) {
			// Player1 gets a bye
			const updateStmt = db.prepare(`
        UPDATE matches SET winner_id = ?, player1_score = 5, player2_score = 0, 
        status = 'completed', ended_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
			updateStmt.run(match.player1_id, match.id);
			advanceWinner(tournamentId, roundNumber, match.tournament_match_number, match.player1_id, match.player1_alias);
		} else if (!hasPlayer1 && hasPlayer2) {
			// Player2 gets a bye
			const updateStmt = db.prepare(`
        UPDATE matches SET winner_id = ?, player1_score = 0, player2_score = 5, 
        status = 'completed', ended_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `);
			updateStmt.run(match.player2_id, match.id);
			advanceWinner(tournamentId, roundNumber, match.tournament_match_number, match.player2_id, match.player2_alias);
		}
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

/**
 * Handle user deletion/anonymization in tournaments (GDPR compliance)
 * - Updates aliases to Guest_xxx format
 * - Auto-forfeits any pending matches (opponent wins by walkover)
 * - Marks user as eliminated in active tournaments
 */
export function handleUserDeletion(userId: number, newAlias: string): void {
	// 1. Update alias in tournament_participants table
	db.prepare(`
		UPDATE tournament_participants 
		SET alias = ? 
		WHERE user_id = ?
	`).run(newAlias, userId);

	// 2. Update alias in matches table (both player1 and player2)
	db.prepare(`
		UPDATE matches 
		SET player1_alias = ? 
		WHERE player1_id = ?
	`).run(newAlias, userId);

	db.prepare(`
		UPDATE matches 
		SET player2_alias = ? 
		WHERE player2_id = ?
	`).run(newAlias, userId);

	// 3. Find and auto-forfeit pending tournament matches where this user is a player
	const pendingMatches = db.prepare(`
		SELECT * FROM matches 
		WHERE (player1_id = ? OR player2_id = ?) 
		AND status = 'pending' 
		AND tournament_id IS NOT NULL
	`).all(userId, userId) as TournamentMatch[];

	for (const match of pendingMatches) {
		const isPlayer1 = match.player1_id === userId;
		const opponentId = isPlayer1 ? match.player2_id : match.player1_id;
		const opponentAlias = isPlayer1 ? match.player2_alias : match.player1_alias;

		// If opponent exists, they win by walkover (5-0)
		if (opponentId) {
			const player1Score = isPlayer1 ? 0 : 5;
			const player2Score = isPlayer1 ? 5 : 0;

			db.prepare(`
				UPDATE matches 
				SET player1_score = ?, player2_score = ?, winner_id = ?, 
					status = 'completed', ended_at = CURRENT_TIMESTAMP
				WHERE id = ?
			`).run(player1Score, player2Score, opponentId, match.id);

			// Advance winner to next round
			if (match.tournament_id && match.tournament_round && match.tournament_match_number) {
				advanceWinnerPublic(
					match.tournament_id,
					match.tournament_round,
					match.tournament_match_number,
					opponentId,
					opponentAlias
				);
			}
		} else {
			// No opponent, just mark match as cancelled
			db.prepare(`
				UPDATE matches SET status = 'cancelled' WHERE id = ?
			`).run(match.id);
		}
	}

	// 4. Mark user as eliminated in all active tournament participations
	db.prepare(`
		UPDATE tournament_participants 
		SET is_eliminated = 1 
		WHERE user_id = ? 
		AND tournament_id IN (SELECT id FROM tournaments WHERE status = 'active')
	`).run(userId);
}

/**
 * Public wrapper for advanceWinner (used by handleUserDeletion)
 */
function advanceWinnerPublic(
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
		const finalStmt = db.prepare(`
			UPDATE tournaments 
			SET status = 'completed', winner_id = ?, ended_at = CURRENT_TIMESTAMP
			WHERE id = ?
		`);
		finalStmt.run(winnerId, tournamentId);

		if (winnerId) {
			db.prepare(`
				UPDATE tournament_participants SET final_position = 1
				WHERE tournament_id = ? AND user_id = ?
			`).run(tournamentId, winnerId);
		}
		return;
	}

	// Determine slot
	const isFirstSlot = currentMatchNumber % 2 === 1;

	if (isFirstSlot) {
		db.prepare(`
			UPDATE matches SET player1_id = ?, player1_alias = ?
			WHERE tournament_id = ? AND tournament_round = ? AND tournament_match_number = ?
		`).run(winnerId, winnerAlias, tournamentId, nextRound, nextMatchNumber);
	} else {
		db.prepare(`
			UPDATE matches SET player2_id = ?, player2_alias = ?
			WHERE tournament_id = ? AND tournament_round = ? AND tournament_match_number = ?
		`).run(winnerId, winnerAlias, tournamentId, nextRound, nextMatchNumber);
	}
}
