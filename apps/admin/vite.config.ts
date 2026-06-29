import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	server: { port: 5173 },
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/test/setup.ts'],
		css: false,
		// Workspace packages ship raw TS/TSX — transform them through Vite.
		server: { deps: { inline: [/@repo\//] } },
		// Tests run against a deterministic, validated env (see src/lib/env.ts).
		env: {
			VITE_API_ORIGIN: 'http://localhost:5050',
			VITE_APP_ENV: 'development',
		},
	},
});
