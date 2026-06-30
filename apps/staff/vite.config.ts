import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
	plugins: [react(), tailwindcss()],
	resolve: {
		alias: {
			'@': fileURLToPath(new URL('./src', import.meta.url)),
		},
	},
	server: { port: 5174 },
	test: {
		environment: 'jsdom',
		globals: true,
		setupFiles: ['./src/test/setup.ts'],
		css: false,
		server: { deps: { inline: [/@repo\//] } },
		env: {
			VITE_API_ORIGIN: 'http://localhost:5050',
			VITE_APP_ENV: 'development',
		},
	},
});
