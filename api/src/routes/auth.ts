// Auth Routes - Handles user registration, login, and logout operations

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import db from '../db/index.js';
import {
	hashPassword,
	verifyPassword,
	generateToken,
	validatePassword,
	validateEmail,
	validateUsername,
} from '../services/auth.js';
import { authMiddleware } from '../middleware/auth.js';
import { handleUserDeletion } from '../services/tournament.js';

interface RegisterBody {
	username: string;
	email: string;
	password: string;
}

interface LoginBody {
	email: string;
	password: string;
}

export default async function authRoutes(fastify: FastifyInstance) {
	// POST /register - Create a new user account with validation
	fastify.post<{ Body: RegisterBody }>(
		'/register',
		async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
			const { username, email, password } = request.body;

			// Ensure all required fields (username, email, password) are present in the request body
			if (!username || !email || !password) {
				return reply.status(400).send({ error: 'Username, email, and password are required' });
			}

			// Validate email
			if (!validateEmail(email)) {
				return reply.status(400).send({ error: 'Invalid email format' });
			}

			// Validate username
			const usernameValidation = validateUsername(username);
			if (!usernameValidation.valid) {
				return reply.status(400).send({ error: usernameValidation.message });
			}

			// Validate password
			const passwordValidation = validatePassword(password);
			if (!passwordValidation.valid) {
				return reply.status(400).send({ error: passwordValidation.message });
			}

			// Check if user already exists
			const existingUser = db
				.prepare('SELECT id FROM users WHERE email = ? OR username = ?')
				.get(email.toLowerCase(), username.toLowerCase());

			if (existingUser) {
				return reply.status(409).send({ error: 'Email or username already exists' });
			}

			// Securely hash the password and insert the new user record into the database
			const passwordHash = await hashPassword(password);
			try {
				const result = db
					.prepare(
						`INSERT INTO users (email, username, display_name, password_hash, avatar_url) 
             VALUES (?, ?, ?, ?, ?)`
					)
					.run(email.toLowerCase(), username.toLowerCase(), username, passwordHash, '/default-avatar.png');

				// Create user stats entry
				db.prepare('INSERT INTO user_stats (user_id) VALUES (?)').run(result.lastInsertRowid);

				return reply.status(201).send({
					message: 'User registered successfully',
					userId: result.lastInsertRowid,
				});
			} catch (error) {
				fastify.log.error(error);
				return reply.status(500).send({ error: 'Failed to create user' });
			}
		}
	);

	// POST /login - Authenticate user and return JWT token in cookie and response
	fastify.post<{ Body: LoginBody }>(
		'/login',
		async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
			const { email, password } = request.body;

			if (!email || !password) {
				return reply.status(400).send({ error: 'Email and password are required' });
			}

			// Find user
			const user = db
				.prepare('SELECT id, email, username, display_name, password_hash, avatar_url, language FROM users WHERE email = ?')
				.get(email.toLowerCase()) as {
					id: number;
					email: string;
					username: string;
					display_name: string;
					password_hash: string | null;
					avatar_url: string;
					language: string;
				} | undefined;

			if (!user) {
				return reply.status(401).send({ error: 'Invalid email or password' });
			}

			// Check if user has password (might be OAuth only)
			if (!user.password_hash) {
				return reply.status(401).send({ error: 'Please use OAuth to login' });
			}

			// Verify password
			const validPassword = await verifyPassword(password, user.password_hash);
			if (!validPassword) {
				return reply.status(401).send({ error: 'Invalid email or password' });
			}

			// Update user status as online and refresh the last seen timestamp on successful login
			db.prepare('UPDATE users SET is_online = TRUE, last_seen_at = CURRENT_TIMESTAMP WHERE id = ?').run(
				user.id
			);

			// Generate token
			const token = generateToken({
				userId: user.id,
				email: user.email,
				username: user.username,
			});

			// Set cookie
			reply.setCookie('token', token, {
				httpOnly: true,
				secure: true,
				sameSite: 'strict',
				path: '/',
				maxAge: 7 * 24 * 60 * 60, // 7 days
			});

			return reply.send({
				message: 'Login successful',
				user: {
					id: user.id,
					email: user.email,
					username: user.username,
					displayName: user.display_name,
					avatarUrl: user.avatar_url,
					language: user.language,
				},
				token, // Also send token in response for flexibility
			});
		}
	);

	// POST /logout - Clear user session and JWT cookie
	fastify.post('/logout', { preHandler: authMiddleware }, async (request, reply) => {
		// Update online status
		if (request.user) {
			db.prepare('UPDATE users SET is_online = FALSE, last_seen_at = CURRENT_TIMESTAMP WHERE id = ?').run(
				request.user.userId
			);
		}

		// Clear cookie
		reply.clearCookie('token', { path: '/' });

		return reply.send({ message: 'Logged out successfully' });
	});

	// GET /me - Get profile and stats for the currently authenticated user
	fastify.get('/me', { preHandler: authMiddleware }, async (request, reply) => {
		if (!request.user) {
			return reply.status(401).send({ error: 'Not authenticated' });
		}

		const user = db
			.prepare(
				`SELECT u.id, u.email, u.username, u.display_name, u.avatar_url, u.is_online, u.language, u.created_at,
                s.total_games, s.wins, s.losses, s.tournaments_won
         FROM users u
         LEFT JOIN user_stats s ON u.id = s.user_id
         WHERE u.id = ?`
			)
			.get(request.user.userId) as Record<string, unknown> | undefined;

		if (!user) {
			return reply.status(404).send({ error: 'User not found' });
		}

		return reply.send({
			id: user.id,
			email: user.email,
			username: user.username,
			displayName: user.display_name,
			avatarUrl: user.avatar_url,
			isOnline: user.is_online,
			language: user.language,
			createdAt: user.created_at,
			stats: {
				totalGames: user.total_games || 0,
				wins: user.wins || 0,
				losses: user.losses || 0,
				tournamentsWon: user.tournaments_won || 0,
			},
		});
	});

	// DELETE /account - Permanently delete current user's account and all associated data (GDPR Right to Erasure)
	fastify.delete('/account', { preHandler: authMiddleware }, async (request, reply) => {
		if (!request.user) {
			return reply.status(401).send({ error: 'Not authenticated' });
		}

		const userId = request.user.userId;

		try {
			// 1. Log the deletion BEFORE deleting (with NULL user_id for privacy)
			db.prepare(`
				INSERT INTO audit_log (user_id, action, details)
				VALUES (NULL, 'account_delete', '{"note": "Account permanently deleted per user request"}')
			`).run();

			// 2. Explicitly delete sessions first (removes IP/user agent data)
			db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);

			// 3. Delete notifications (both received AND sent by this user)
			db.prepare('DELETE FROM notifications WHERE user_id = ?').run(userId);
			db.prepare('DELETE FROM notifications WHERE sender_id = ?').run(userId);

			// 4. Handle tournament cleanup (forfeit matches, update aliases)
			handleUserDeletion(userId, 'Deleted User');

			// 5. Delete user (cascades to user_stats, friendships)
			// Matches: player_id → NULL (SET NULL constraint)
			db.prepare('DELETE FROM users WHERE id = ?').run(userId);

			// 5. Clear cookie
			reply.clearCookie('token', { path: '/' });

			return reply.send({
				message: 'Account deleted successfully. This action cannot be undone.',
				note: 'All personal data has been permanently removed from our systems.'
			});
		} catch (error) {
			fastify.log.error(error);
			return reply.status(500).send({ error: 'Failed to delete account' });
		}
	});

	// POST /anonymize - Anonymize user data (GDPR Soft Delete) - Retains stats but removes PII
	fastify.post('/anonymize', { preHandler: authMiddleware }, async (request, reply) => {
		if (!request.user) {
			return reply.status(401).send({ error: 'Not authenticated' });
		}

		const userId = request.user.userId;

		try {
			const randomId = crypto.randomBytes(4).toString('hex');
			const anonymousName = `anonymous_${randomId}`;
			const anonymousEmail = `${anonymousName}@transcendence.local`;

			// 1. Log action
			db.prepare(`
				INSERT INTO audit_log (user_id, action, details)
				VALUES (?, 'account_anonymize', '{"note": "User requested anonymization"}')
			`).run(userId);

			// 2. Delete sessions & notifications (both received AND sent) & friends
			db.prepare('DELETE FROM sessions WHERE user_id = ?').run(userId);
			db.prepare('DELETE FROM notifications WHERE user_id = ?').run(userId);
			db.prepare('DELETE FROM notifications WHERE sender_id = ?').run(userId);
			db.prepare('DELETE FROM friendships WHERE user_id = ? OR friend_id = ?').run(userId, userId);

			// 3. Handle matches/tournaments cleanup if needed (stats are kept, but maybe active tournaments need to know?)
			// For now, we just anonymize the user record.
			// Ideally, we should forfeit active matches, but per simple requirement, we focus on user record.
			handleUserDeletion(userId, anonymousName); // Re-using deletion handler to cleanup active tournaments

			// 4. Anonymize user record
			db.prepare(`
				UPDATE users 
				SET email = ?,
					username = ?,
					display_name = ?,
					password_hash = NULL,
					oauth_provider = NULL,
					oauth_id = NULL,
					avatar_url = '/default-avatar.png',
					is_anonymized = TRUE,
					is_online = FALSE,
					updated_at = CURRENT_TIMESTAMP
				WHERE id = ?
			`).run(anonymousEmail, anonymousName, anonymousName, userId);

			// 5. Clear cookie
			reply.clearCookie('token', { path: '/' });

			return reply.send({
				message: 'Account anonymized successfully.',
				note: 'Your personal data has been removed. Your game stats remain under an anonymous alias.'
			});

		} catch (error) {
			fastify.log.error(error);
			return reply.status(500).send({ error: 'Failed to anonymize account' });
		}
	});

	// GET /export-data - Export all user data (GDPR Right to Data Portability)
	fastify.get('/export-data', { preHandler: authMiddleware }, async (request, reply) => {
		if (!request.user) {
			return reply.status(401).send({ error: 'Not authenticated' });
		}

		const userId = request.user.userId;

		try {
			// Get user data
			const user = db.prepare(`
				SELECT id, email, username, display_name, avatar_url, language, created_at
				FROM users WHERE id = ?
			`).get(userId);

			// Get user stats
			const stats = db.prepare('SELECT * FROM user_stats WHERE user_id = ?').get(userId);

			// Get match history
			const matches = db.prepare(`
				SELECT id, player1_id, player2_id, player1_score, player2_score,
					winner_id, match_type, started_at, ended_at
				FROM matches
				WHERE player1_id = ? OR player2_id = ?
				ORDER BY ended_at DESC
			`).all(userId, userId);

			// Get friendships
			const friends = db.prepare(`
				SELECT f.*, u.username as friend_username
				FROM friendships f
				JOIN users u ON (f.friend_id = u.id AND f.user_id = ?) OR (f.user_id = u.id AND f.friend_id = ?)
				WHERE f.user_id = ? OR f.friend_id = ?
			`).all(userId, userId, userId, userId);

			// Get tournaments
			const tournaments = db.prepare(`
				SELECT tp.*, t.name as tournament_name
				FROM tournament_participants tp
				JOIN tournaments t ON tp.tournament_id = t.id
				WHERE tp.user_id = ?
			`).all(userId);

			// Log export
			db.prepare(`
				INSERT INTO audit_log (user_id, action, details)
				VALUES (?, 'data_export', '{}')
			`).run(userId);

			const exportData = {
				exportDate: new Date().toISOString(),
				user,
				stats,
				matches,
				friends,
				tournaments,
			};

			reply.header('Content-Type', 'application/json');
			reply.header('Content-Disposition', `attachment; filename="pong_data_${userId}.json"`);
			return reply.send(exportData);
		} catch (error) {
			fastify.log.error(error);
			return reply.status(500).send({ error: 'Failed to export data' });
		}
	});
}
