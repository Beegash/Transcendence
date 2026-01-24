/**
 * Game Constants
 * Shared configuration for Pong game
 */

// Canvas dimensions
export const CANVAS_WIDTH = 800;
export const CANVAS_HEIGHT = 400;

// Paddle settings
export const PADDLE_WIDTH = 10;
export const PADDLE_HEIGHT = 60; // Reduced from 80 for increased difficulty
export const PADDLE_SPEED = 8;

// Ball settings
export const BALL_SIZE = 10;
export const BALL_SPEED = 7; // Increased from 5 for faster gameplay
export const BALL_SPEED_INCREMENT = 0.3; // Speed increase per paddle hit
export const BALL_MAX_SPEED = 30; // Cap to prevent unplayable speeds

// Game rules
export const WINNING_SCORE = 5;

// AI settings (per project requirements: 1 second refresh)
export const AI_REFRESH_INTERVAL = 1000; // ms - "AI can only refresh its view once per second"
