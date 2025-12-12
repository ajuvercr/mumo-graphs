import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

import polyfillNode from 'rollup-plugin-polyfill-node';
// import nodePolyfills from 'rollup-plugin-node-polyfills';
import { nodePolyfills } from 'vite-plugin-node-polyfills';

import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import rollupNodePolyFill from 'rollup-plugin-polyfill-node';

import { nodeModulesPolyfillPlugin } from 'esbuild-plugins-node-modules-polyfill';

export default defineConfig({
	esbuild: {
		supported: {
			'top-level-await': true //browsers can handle top-level-await features
		}
	},
	define: {
		global: 'globalThis'
	},
	optimizeDeps: {
		include: ['ldes-client'],
		esbuildOptions: {
			plugins: [
				NodeGlobalsPolyfillPlugin({
					buffer: true,
					process: true
				}),
				nodeModulesPolyfillPlugin()
			]
		}
	},
	build: {
		// cssMinify: false, // Deactivate esbuild and use cssnano for CSS only
		minify: false,
		rollupOptions: {
			plugins: [rollupNodePolyFill()]
		}
	},
	plugins: [sveltekit()]
});
