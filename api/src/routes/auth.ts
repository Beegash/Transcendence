/**
 * Auth Routes
 * Handles user registration, login, logout
 */

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
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
	/**
	 * POST /register
	 * Create a new user account
	 */
	fastify.post<{ Body: RegisterBody }>(
		'/register',
		async (request: FastifyRequest<{ Body: RegisterBody }>, reply: FastifyReply) => {
			const { username, email, password } = request.body;

			// Validate input
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

			// Hash password
			const passwordHash = await hashPassword(password);

			// Create user
			try {
				const result = db
					.prepare(
						`INSERT INTO users (email, username, display_name, password_hash) 
             VALUES (?, ?, ?, ?)`
					)
					.run(email.toLowerCase(), username.toLowerCase(), username, passwordHash);

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

	/**
	 * POST /login
	 * Authenticate user and return JWT token
	 */
	fastify.post<{ Body: LoginBody }>(
		'/login',
		async (request: FastifyRequest<{ Body: LoginBody }>, reply: FastifyReply) => {
			const { email, password } = request.body;

			if (!email || !password) {
				return reply.status(400).send({ error: 'Email and password are required' });
			}

			// Find user
			const user = db
				.prepare('SELECT id, email, username, display_name, password_hash FROM users WHERE email = ?')
				.get(email.toLowerCase()) as {
					id: number;
					email: string;
					username: string;
					display_name: string;
					password_hash: string | null;
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

			// Update online status
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
				},
				token, // Also send token in response for flexibility
			});
		}
	);

	/**
	 * POST /logout
	 * Clear session and JWT cookie
	 */
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

	/**
	 * GET /me
	 * Get current authenticated user
	 */
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
}
