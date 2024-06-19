import axios from 'axios';
import * as esbuild from 'esbuild-wasm';
import wasm from 'esbuild-wasm/esbuild.wasm?url';

type MSG = { command: string; payload: { vfs: { [key: string]: string }, code: string } };

self.onmessage = function(e) {
    const data = e.data as MSG;
	
	if (data.command === 'compile') {
		compile(data.payload.vfs, data.payload.code).then((bundled) => {
			self.postMessage({ command: 'compiled', payload: bundled });
		});
	}
}

const resolverPlugin = (vfs: { [key: string]: string }) => {
	return {
		name: 'unpkg-path-plugin',
		setup(build: esbuild.PluginBuild) {
			const fileCache = new Map

			build.onResolve({ filter: /.*/ }, async (args) => {
				if (args.path.includes("svelte/")) {
					return { path: `https://unpkg.com/${args.path}/index.mjs`, namespace: 'unpkg' };
				}

				if (args.path === 'main.js') {
					return { path: args.path, namespace: 'unpkg' };
				}

				if (args.path.startsWith('./') && vfs[args.path.substring(2)]) {
					return {
						namespace: 'unpkg',
						path: args.path.substring(2)
					}
				}

				if (args.path.includes('./') || args.path.includes('../')) {
					args.resolveDir = args.resolveDir.replace('C:', '').replaceAll('\\', '/'); // I hate you windows

					return {
						namespace: 'unpkg',
						path: new URL(args.path, 'https://unpkg.com' + args.resolveDir + '/').href
					};
				}
				return {
					namespace: 'unpkg',
					path: `https://unpkg.com/${args.path}`
				};
			});

			build.onLoad({ filter: /.*/, namespace: 'unpkg' }, async (args) => {
				if (vfs[args.path]) {
					return {
						contents: vfs[args.path],
						loader: 'js'
					};
				}

				const cached = await fileCache.get(args.path);
				if (cached) {
					return cached;
				}

				const response = await axios.get(args.path);

                // console.log(response, response.request.responseUrl);
                

				const result = {
					loader: 'js',
					contents: response.data,
					resolveDir: 'C:' +  new URL('./', response.request.responseURL).pathname // i hate you windows (TODO: check if its valid on mac/linux)
				};

				await fileCache.set(args.path, result);

				return result;
			});
		}
	} as esbuild.Plugin;
};

async function init() {
	try {
		await esbuild.initialize({
			worker: false, // use worker
			wasmURL: wasm,
		  });
	} catch (e) {
		console.log('esbuild init error:', e);
	}
}

async function compile(vfs: { [key: string]: string }, code: string) {
	await init();

	return (await esbuild.build({
		stdin: {
			contents: code,
			loader: 'js',
			sourcefile: 'input.js'
		},
		/* alias: {
			'svelte': path.resolve('node_modules', 'svelte/src/runtime'),
		}, */
		bundle: true,
		mainFields: ['svelte', 'browser', 'module', 'main'],
		conditions: ['svelte', 'browser'],
		external: ['@svelte/internal', 'svelte/internal', 'svelte'],
		plugins: [
			resolverPlugin(vfs), 
			//sveltePlugin(), 
		],
		platform: 'browser',
		write: false,
		outdir: 'out',
		treeShaking: true,
		format: 'esm',
		// keepNames: true,
		minify: true
	})).outputFiles[0].text;
}