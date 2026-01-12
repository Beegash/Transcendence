/**
 * Stats Service
 * Provides user and game statistics
 */

import db from '../db/index.js';

export interface UserStats {
	user_id: number;
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
	total_play_time_seconds: number;
}

export interface MatchHistory {
	id: number;
	opponent_name: string;
	player_score: number;
	opponent_score: number;
	won: boolean;
	match_type: string;
	played_at: string;
}

export interface LeaderboardEntry {
	rank: number;
	user_id: number;
	username: string;
	display_name: string;
	avatar_url: string;
	wins: number;
	losses: number;
	win_rate: number;
}

export interface GlobalStats {
	total_users: number;
	total_matches: number;
	total_tournaments: number;
	matches_today: number;
	active_tournaments: number;
}

/**
 * Get or create user stats
 */
export function getUserStats(userId: number): UserStats | null {
	// First ensure user_stats row exists
	const checkStmt = db.prepare('SELECT * FROM user_stats WHERE user_id = ?');
	let stats = checkStmt.get(userId);

	if (!stats) {
		// Create initial stats
		const insertStmt = db.prepare('INSERT OR IGNORE INTO user_stats (user_id) VALUES (?)');
		insertStmt.run(userId);
		stats = checkStmt.get(userId);
	}

	// Join with user info
	const stmt = db.prepare(`
    SELECT 
      us.*,
      u.username,
      u.display_name,
      u.avatar_url
    FROM user_stats us
    JOIN users u ON us.user_id = u.id
    WHERE us.user_id = ?
  `);

	const result = stmt.get(userId) as any;

	if (!result) return null;

	return {
		...result,
		win_rate: result.total_games > 0
			? Math.round((result.wins / result.total_games) * 100)
			: 0,
	};
}

/**
 * Get match history for a user
 */
export function getMatchHistory(userId: number, limit = 20): MatchHistory[] {
	const stmt = db.prepare(`
    SELECT 
      m.id,
      CASE 
        WHEN m.player1_id = ? THEN COALESCE(m.player2_alias, u2.username, 'Unknown')
        ELSE COALESCE(m.player1_alias, u1.username, 'Unknown')
      END as opponent_name,
      CASE 
        WHEN m.player1_id = ? THEN m.player1_score
        ELSE m.player2_score
      END as player_score,
      CASE 
        WHEN m.player1_id = ? THEN m.player2_score
        ELSE m.player1_score
      END as opponent_score,
      CASE 
        WHEN m.winner_id = ? THEN 1
        ELSE 0
      END as won,
      m.match_type,
      m.ended_at as played_at
    FROM matches m
    LEFT JOIN users u1 ON m.player1_id = u1.id
    LEFT JOIN users u2 ON m.player2_id = u2.id
    WHERE (m.player1_id = ? OR m.player2_id = ?)
      AND m.status = 'completed'
    ORDER BY m.ended_at DESC
    LIMIT ?
  `);

	return stmt.all(userId, userId, userId, userId, userId, userId, limit) as MatchHistory[];
}

/**
 * Get leaderboard
 */
export function getLeaderboard(limit = 10): LeaderboardEntry[] {
	const stmt = db.prepare(`
    SELECT 
      u.id as user_id,
      u.username,
      u.display_name,
      u.avatar_url,
      COALESCE(us.wins, 0) as wins,
      COALESCE(us.losses, 0) as losses,
      CASE 
        WHEN COALESCE(us.total_games, 0) > 0 
        THEN ROUND((CAST(us.wins AS FLOAT) / us.total_games) * 100)
        ELSE 0
      END as win_rate
    FROM users u
    LEFT JOIN user_stats us ON u.id = us.user_id
    WHERE u.is_anonymized = 0
    ORDER BY COALESCE(us.wins, 0) DESC, win_rate DESC
    LIMIT ?
  `);

	const results = stmt.all(limit) as any[];

	return results.map((r, index) => ({
		...r,
		rank: index + 1,
	}));
}

/**
 * Get global platform stats
 */
export function getGlobalStats(): GlobalStats {
	const usersStmt = db.prepare('SELECT COUNT(*) as count FROM users WHERE is_anonymized = 0');
	const matchesStmt = db.prepare('SELECT COUNT(*) as count FROM matches WHERE status = ?');
	const tournamentsStmt = db.prepare('SELECT COUNT(*) as count FROM tournaments');
	const todayStmt = db.prepare(`
    SELECT COUNT(*) as count FROM matches 
    WHERE status = 'completed' AND DATE(ended_at) = DATE('now')
  `);
	const activeTournamentsStmt = db.prepare(`
    SELECT COUNT(*) as count FROM tournaments WHERE status = 'active'
  `);

	return {
		total_users: (usersStmt.get() as any).count,
		total_matches: (matchesStmt.get('completed') as any).count,
		total_tournaments: (tournamentsStmt.get() as any).count,
		matches_today: (todayStmt.get() as any).count,
		active_tournaments: (activeTournamentsStmt.get() as any).count,
	};
}

/**
 * Update user stats after a match
 */
export function updateStatsAfterMatch(
	winnerId: number | null,
	loserId: number | null,
	winnerScore: number,
	loserScore: number
): void {
	if (winnerId) {
		// Ensure stats exist
		db.prepare('INSERT OR IGNORE INTO user_stats (user_id) VALUES (?)').run(winnerId);

		// Update winner stats
		const stmt = db.prepare(`
      UPDATE user_stats SET
        total_games = total_games + 1,
        wins = wins + 1,
        win_streak = win_streak + 1,
        best_win_streak = MAX(best_win_streak, win_streak + 1),
        total_points_scored = total_points_scored + ?,
        total_points_conceded = total_points_conceded + ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);
		stmt.run(winnerScore, loserScore, winnerId);
	}

	if (loserId) {
		// Ensure stats exist
		db.prepare('INSERT OR IGNORE INTO user_stats (user_id) VALUES (?)').run(loserId);

		// Update loser stats
		const stmt = db.prepare(`
      UPDATE user_stats SET
        total_games = total_games + 1,
        losses = losses + 1,
        win_streak = 0,
        total_points_scored = total_points_scored + ?,
        total_points_conceded = total_points_conceded + ?,
        updated_at = CURRENT_TIMESTAMP
      WHERE user_id = ?
    `);
		stmt.run(loserScore, winnerScore, loserId);
	}
}

/**
 * Record match in database
 */
export function recordMatch(
	player1Id: number | null,
	player2Id: number | null,
	player1Score: number,
	player2Score: number,
	matchType: 'casual' | 'tournament' | 'ai' | 'local',
	player1Alias?: string,
	player2Alias?: string,
	tournamentId?: number
): number {
	const winnerId = player1Score > player2Score ? player1Id : player2Id;

	const stmt = db.prepare(`
    INSERT INTO matches (
      player1_id, player2_id, player1_alias, player2_alias,
      player1_score, player2_score, winner_id,
      match_type, tournament_id, status,
      started_at, ended_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'completed', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);

	const result = stmt.run(
		player1Id, player2Id,
		player1Alias || null, player2Alias || null,
		player1Score, player2Score, winnerId,
		matchType, tournamentId || null
	);

	// Update stats
	updateStatsAfterMatch(
		winnerId,
		winnerId === player1Id ? player2Id : player1Id,
		Math.max(player1Score, player2Score),
		Math.min(player1Score, player2Score)
	);

	return result.lastInsertRowid as number;
}
