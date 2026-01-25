export function setupKeyboardControls(
	onKeyDown: (e: KeyboardEvent) => void,
	onKeyUp: (e: KeyboardEvent) => void
): () => void {
	window.addEventListener('keydown', onKeyDown);
	window.addEventListener('keyup', onKeyUp);

	return () => {
		window.removeEventListener('keydown', onKeyDown);
		window.removeEventListener('keyup', onKeyUp);
	};
}

export function setupTouchControls(
	canvas: HTMLCanvasElement,
	onPaddleMove: (deltaY: number, touchX: number) => void,
	onTap?: () => void
): () => void {
	let touchStartY: number | null = null;
	let touchMoved = false;

	const touchStartHandler = (e: TouchEvent) => {
		if (e.touches.length > 0) {
			touchStartY = e.touches[0].clientY;
			touchMoved = false;
		}
	};

	const touchMoveHandler = (e: TouchEvent) => {
		e.preventDefault();
		if (touchStartY !== null && e.touches.length > 0) {
			const rect = canvas.getBoundingClientRect();
			const touchX = e.touches[0].clientX - rect.left;
			const deltaY = e.touches[0].clientY - touchStartY;
			onPaddleMove(deltaY, touchX);
			touchStartY = e.touches[0].clientY;
			touchMoved = true;
		}
	};

	const touchEndHandler = () => {
		if (!touchMoved && onTap) {
			onTap();
		}
		touchStartY = null;
	};

	canvas.addEventListener('touchstart', touchStartHandler, { passive: false });
	canvas.addEventListener('touchmove', touchMoveHandler, { passive: false });
	canvas.addEventListener('touchend', touchEndHandler);

	return () => {
		canvas.removeEventListener('touchstart', touchStartHandler);
		canvas.removeEventListener('touchmove', touchMoveHandler);
		canvas.removeEventListener('touchend', touchEndHandler);
	};
}
