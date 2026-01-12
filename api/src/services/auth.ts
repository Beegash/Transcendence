/**
 * Auth Service
 * Handles password hashing and JWT token management
 */

import * as argon2 from 'argon2';
import jwt, { SignOptions } from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JwtPayload {
	userId: number;
	email: string;
	username: string;
}

/**
 * Hash a password using Argon2
 */
export async function hashPassword(password: string): Promise<string> {
	return argon2.hash(password);
}

/**
 * Verify a password against a hash
 */
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
	try {
		return await argon2.verify(hash, password);
	} catch {
		return false;
	}
}

/**
 * Generate a JWT token
 */
export function generateToken(payload: JwtPayload): string {
	// Use numeric expiresIn (seconds) to avoid type issues
	const expiresInSeconds = 7 * 24 * 60 * 60; // 7 days
	return jwt.sign(payload, JWT_SECRET, { expiresIn: expiresInSeconds });
}

/**
 * Verify and decode a JWT token
 */
export function verifyToken(token: string): JwtPayload | null {
	try {
		return jwt.verify(token, JWT_SECRET) as JwtPayload;
	} catch {
		return null;
	}
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): { valid: boolean; message?: string } {
	if (password.length < 8) {
		return { valid: false, message: 'Password must be at least 8 characters' };
	}
	if (!/[A-Z]/.test(password)) {
		return { valid: false, message: 'Password must contain at least one uppercase letter' };
	}
	if (!/[a-z]/.test(password)) {
		return { valid: false, message: 'Password must contain at least one lowercase letter' };
	}
	if (!/[0-9]/.test(password)) {
		return { valid: false, message: 'Password must contain at least one number' };
	}
	return { valid: true };
}

/**
 * Validate email format
 */
export function validateEmail(email: string): boolean {
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	return emailRegex.test(email);
}

/**
 * Validate username
 */
export function validateUsername(username: string): { valid: boolean; message?: string } {
	if (username.length < 3) {
		return { valid: false, message: 'Username must be at least 3 characters' };
	}
	if (username.length > 20) {
		return { valid: false, message: 'Username must be at most 20 characters' };
	}
	if (!/^[a-zA-Z0-9_]+$/.test(username)) {
		return { valid: false, message: 'Username can only contain letters, numbers, and underscores' };
	}
	return { valid: true };
}
