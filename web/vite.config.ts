import { defineConfig } from 'vite';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
	root: '.',
	publicDir: 'public',
	build: {
		outDir: 'dist',
		emptyOutDir: true,
	},
	resolve: {
		alias: {
			'@': resolve(__dirname, 'src'),
		},
	},
	server: {
		host: '0.0.0.0',
		port: 5173,
		strictPort: true,
		// Cloudflare Tunnel veya Ngrok gibi araçlarla dışarıdan erişim sağlandığında 
		// Vite'ın "Blocked request" hatası vermemesi için tüm hostlara izin veriyoruz.
		allowedHosts: true,
		watch: {
			usePolling: true, // For Docker
		},
	},
});
