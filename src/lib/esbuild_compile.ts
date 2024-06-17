import axios from 'axios';
//import sveltePlugin from 'esbuild-svelte'; // causes reference error (buffer) change the module at line 36
import * as esbuild from 'esbuild-wasm';
import template from './html_template.html?raw';

function resolvePath(base: string, relative: string): string {
	let stack = base.split("/"),
		parts = relative.split("/");
	stack.pop(); // Remove current file name (or empty string)
				 // (omit if "base" is the directory without a trailing slash)
	for (let i = 0; i < parts.length; i++) {
	  if (parts[i] == ".")
		continue;
	  if (parts[i] == "..")
		stack.pop();
	  else
		stack.push(parts[i]);
	}
	return stack.join("/");
  }

const resolverPlugin = (vfs: { [key: string]: string }) => {
	return {
		name: 'unpkg-path-plugin',
		setup(build: any) {
			const fileCache = new Map();

			build.onResolve({ filter: /.*/ }, async (args: any) => {
				if (args.path === 'main.js') {
					return { path: args.path, namespace: 'unpkg' };
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

			build.onLoad({ filter: /.*/, namespace: 'unpkg' }, async (args: any) => {
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
	};
};

export async function init() {
	await esbuild.initialize({
		worker: false,
		wasmURL: '../../../node_modules/esbuild-wasm/esbuild.wasm',
	  });
}

const htmlTemplate = (code: string) => {
	return template.replace('<!-- 349857 bundled code -->', '<script type="module">' + code + '</script>');
};

export const esbuildCompile = async (code: string) => {
  try {

    const vfs: { [key: string]: string } = {
		'main.js': code,
	}; // virtual file system for esbuild

    // console.log(code);
	const result = await esbuild.build({
		stdin: {
			contents: code,
			loader: 'js',
			sourcefile: 'input.mjs'
		},
		bundle: true,
		mainFields: ['svelte', 'browser', 'module', 'main'],
		conditions: ['svelte', 'browser'],
		plugins: [
			resolverPlugin(vfs), 
			//sveltePlugin(), 
		],
		write: false,
		outdir: 'out',
		treeShaking: true,
		// keepNames: true,
		minify: true
	}); // generate bundled js

	const compiled = result.outputFiles[0].text;

    return htmlTemplate(compiled);
  } catch (error) {
    console.error('esbuildCompile error:', error);
    return '';
  }
};