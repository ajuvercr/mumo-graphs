import { defineConfig } from 'vite';
import { sveltekit } from '@sveltejs/kit/vite';
export default defineConfig({
	plugins: [sveltekit()],
	optimizeDeps: {
		include: ['asynciterator', 'domelementtype', 'domutils']
	},
	ssr: {
		noExternal: ['asynciterator', 'domelementtype', 'domutils']
	}
});
