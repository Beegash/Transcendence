/**
 * Auth Middleware
 * JWT Authentication for protected routes
 */

import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken, JwtPayload } from '../services/auth.js';

// Extend FastifyRequest to include user
declare module 'fastify' {
	interface FastifyRequest {
		user?: JwtPayload;
	}
}

/**
 * Authentication middleware
 * Verifies JWT token from cookie or Authorization header
 */
export async function authMiddleware(
	request: FastifyRequest,
	reply: FastifyReply
): Promise<void> {
	// Try to get token from cookie first, then from Authorization header
	let token = request.cookies?.token;

	if (!token) {
		const authHeader = request.headers.authorization;
		if (authHeader?.startsWith('Bearer ')) {
			token = authHeader.substring(7);
		}
	}

	if (!token) {
		reply.status(401).send({ error: 'Authentication required' });
		return;
	}

	const payload = verifyToken(token);

	if (!payload) {
		reply.status(401).send({ error: 'Invalid or expired token' });
		return;
	}

	// Attach user to request
	request.user = payload;
}

/**
 * Optional auth middleware
 * Does not fail if no token, just attaches user if present
 */
export async function optionalAuthMiddleware(
	request: FastifyRequest,
	_reply: FastifyReply
): Promise<void> {
	let token = request.cookies?.token;

	if (!token) {
		const authHeader = request.headers.authorization;
		if (authHeader?.startsWith('Bearer ')) {
			token = authHeader.substring(7);
		}
	}

	if (token) {
		const payload = verifyToken(token);
		if (payload) {
			request.user = payload;
		}
	}
}
