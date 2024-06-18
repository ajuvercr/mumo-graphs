import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

import polyfillNode from 'rollup-plugin-polyfill-node';
import nodePolyfills from 'rollup-plugin-node-polyfills';
// import { nodePolyfills } from 'vite-plugin-node-polyfills';

import { NodeGlobalsPolyfillPlugin } from '@esbuild-plugins/node-globals-polyfill';
import { NodeModulesPolyfillPlugin } from '@esbuild-plugins/node-modules-polyfill';
import rollupNodePolyFill from 'rollup-plugin-polyfill-node';

export default defineConfig({
  esbuild: {
    supported: {
      'top-level-await': true //browsers can handle top-level-await features
    },
  },
  optimizeDeps: {
    esbuildOptions: {
      // Node.js global to browser globalThis
      define: {
        global: 'globalThis'
      },
      // Enable esbuild polyfill plugins
      plugins: [
        NodeGlobalsPolyfillPlugin({
          buffer: true,
          process: true
        }),
        NodeModulesPolyfillPlugin()
      ]
    }
  },
  build: {
    rollupOptions: {
      plugins: [rollupNodePolyFill()]
    }
  },
  plugins: [
    //
    // polyfillNode({
    // }),
    //   // // To add only specific polyfills, add them here. If no option is passed, adds all polyfills
    //   // include: ['path'],
    //   // // To exclude specific polyfills, add them to this list. Note: if include is provided, this has no effect
    //   // exclude: [
    //   //   'http' // Excludes the polyfill for `http` and `node:http`.
    //   // ],
    //   // Whether to polyfill specific globals.
    //   globals: {
    //     // Buffer: true, // can also be 'build', 'dev', or false
    //     global: true,
    //     process: true,
    //   }
    // }),

    sveltekit()
  ]
});
