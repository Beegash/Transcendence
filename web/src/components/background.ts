
// Parallax Cloud Background Component
//Generates random clouds and handles scroll parallax effects
 

export function initBackground(): void {
	const container = document.createElement('div');
	container.id = 'cloud-container';
	container.className = 'fixed inset-0 pointer-events-none z-0 overflow-hidden';
	document.body.prepend(container);

	// Configuration
	const CLOUD_COUNT = 15;
	const LAYERS = 3;
	// Cloud images downloaded to public folder
	const cloudImages = ['/cloud1.png', '/cloud2.png', '/cloud3.png'];

	// Create Parallax Layers
	const layerContainers: HTMLDivElement[] = [];
	for (let l = 1; l <= LAYERS; l++) {
		const layerDiv = document.createElement('div');
		layerDiv.className = `fixed inset-0 w-full h-full pointer-events-none layer-${l}`;
		// Layer rate: slower for background (0.15), faster for foreground (0.45)
		layerDiv.dataset.rate = (l * 0.15).toString();
		container.appendChild(layerDiv);
		layerContainers.push(layerDiv);
	}

	// Generate Clouds
	for (let i = 0; i < CLOUD_COUNT; i++) {
		const layerIndex = Math.floor(Math.random() * LAYERS);
		const layerDiv = layerContainers[layerIndex];

		const cloud = document.createElement('img');
		const imgIndex = Math.floor(Math.random() * cloudImages.length);
		cloud.src = cloudImages[imgIndex];
		cloud.alt = 'cloud';

		// Random Properties
		// Front layers (higher index) are bigger and clearer
		const size = 150 + Math.random() * 250 + (layerIndex * 60);
		const top = Math.random() * 120 - 10; // Spread vertically (-10% to 110%)

		// Opacity: Background clouds are more visible now (0.6), foreground solid (1.0)
		const opacity = 0.6 + (layerIndex * 0.2);

		// Speed: Back layers move slower
		const duration = 50 + Math.random() * 60 - (layerIndex * 15);

		cloud.className = 'absolute object-contain pointer-events-none';
		cloud.style.width = `${size}px`;
		cloud.style.height = 'auto';
		cloud.style.top = `${top}%`;
		cloud.style.opacity = opacity.toString();
		cloud.style.willChange = 'transform'; // Optimize animation

		// Horizontal drift animation
		cloud.style.animation = `drift-cloud ${duration}s linear infinite`;
		cloud.style.animationDelay = `-${Math.random() * duration}s`;

		// Set initial position off-screen left to ensure smooth entry
		cloud.style.left = '-10%';

		// Removed brightness filter to preserve details
		// cloud.style.filter = 'brightness(1.5)';

		layerDiv.appendChild(cloud);
	}

	// Parallax Scroll Handler
	let ticking = false;
	window.addEventListener('scroll', () => {
		if (!ticking) {
			window.requestAnimationFrame(() => {
				const scrolled = window.scrollY;
				layerContainers.forEach(layer => {
					const rate = parseFloat(layer.dataset.rate || '0');
					const yPos = -(scrolled * rate);
					layer.style.transform = `translate3d(0, ${yPos}px, 0)`;
				});
				ticking = false;
			});
			ticking = true;
		}
	});
}
