import { CANVAS_WIDTH, CANVAS_HEIGHT, PADDLE_WIDTH, PADDLE_HEIGHT, BALL_SIZE } from '../constants';

export function drawBackground(ctx: CanvasRenderingContext2D): void {
	// Clear - Pong Table Green
	ctx.fillStyle = '#326255';
	ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
}

export function drawCenterLine(ctx: CanvasRenderingContext2D): void {
	ctx.setLineDash([10, 10]);
	ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
	ctx.lineWidth = 2;
	ctx.beginPath();
	ctx.moveTo(CANVAS_WIDTH / 2, 0);
	ctx.lineTo(CANVAS_WIDTH / 2, CANVAS_HEIGHT);
	ctx.stroke();
	ctx.setLineDash([]);
}

export function drawPaddle(ctx: CanvasRenderingContext2D, x: number, y: number, color: string): void {
	ctx.fillStyle = color;
	ctx.fillRect(x, y, PADDLE_WIDTH, PADDLE_HEIGHT);
}

export function drawBall(ctx: CanvasRenderingContext2D, x: number, y: number): void {
	// Ball - Orange Circle
	ctx.fillStyle = '#EA871E';
	ctx.beginPath();
	ctx.arc(x + BALL_SIZE / 2, y + BALL_SIZE / 2, BALL_SIZE / 2, 0, Math.PI * 2);
	ctx.fill();
}

export function drawScore(ctx: CanvasRenderingContext2D, score1: number, score2: number, positions: { score1X: number, score2X: number }): void {
	ctx.font = '48px Orbitron, monospace';
	ctx.textAlign = 'center';

	ctx.fillStyle = '#C0392B';
	ctx.fillText(score1.toString(), positions.score1X, 60);

	ctx.fillStyle = '#3498DB';
	ctx.fillText(score2.toString(), positions.score2X, 60);
}

export function drawEndGameMessage(ctx: CanvasRenderingContext2D, message: string, color: string, y?: number): void {
	ctx.font = '32px Orbitron, monospace';
	ctx.fillStyle = color;
	ctx.textAlign = 'center';
	ctx.fillText(message, CANVAS_WIDTH / 2, y || CANVAS_HEIGHT / 2);
}

export function drawPauseMessage(ctx: CanvasRenderingContext2D, message: string): void {
	ctx.font = '16px Inter, sans-serif';
	ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
	ctx.textAlign = 'center';
	ctx.fillText(message, CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2);
}
