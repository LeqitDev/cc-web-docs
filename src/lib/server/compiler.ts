import axios from 'axios';
import sveltePlugin from 'esbuild-svelte';
import { compile } from 'mdsvex';
import { compile as compileSvelte } from 'svelte/compiler';
import * as esbuild from 'esbuild';
import { doc_entries } from '../store';
import { get } from 'svelte/store';
import remarkHeadingId from "remark-heading-id";
import rehypeRewrite from "rehype-rewrite";
import rehypeStringify from "rehype-stringify";

// resolve and load imports from unpkg (https://github.com/evanw/esbuild/issues/2327)
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

				const { data, request } = await axios.get(args.path);

				const result = {
					loader: 'js',
					contents: data,
					resolveDir: 'C:' + new URL('./', request.res.responseUrl).pathname // i hate you windows (TODO: check if its valid on mac/linux)
				};

				await fileCache.set(args.path, result);

				return result;
			});
		}
	};
};

export async function compileMDsveX(issue: App.Issue) {
	let mdsvex_obj = await compile(issue.body, {
		remarkPlugins: [
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			[remarkHeadingId, { defaults: true }],
		],
		rehypePlugins: [
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			[rehypeRewrite, {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				rewrite: (node) => {
					if (node.tagName === "h2") {
						node.properties.className = "h2";
					} else if (node.tagName === "h3") {
						node.properties.className = "h3";
					} else if (node.tagName === "h4") {
						node.properties.className = "h4";
					} else if (node.tagName === "h5") {
						node.properties.className = "h5";
					} else if (node.tagName === "h6") {
						node.properties.className = "h6";
					}
				}
			}],
			rehypeStringify
		],
	});

	if (mdsvex_obj) {
		issue.body = mdsvex_obj.code;
		issue.frontmatter = mdsvex_obj.data?.fm as { [key: string]: any };
	}

	return issue;
}

export async function compileAndBundleSvelte(mdsvex_code: string): Promise<string> {
	let startTime = Date.now();
	let svelte_obj = compileSvelte(mdsvex_code, { generate: 'dom', hydratable: false }); // compile svelte
	const js_code = svelte_obj.js.code
		.replaceAll('svelte/internal', 'svelte/src/runtime/internal')
		.replace('export { metadata };', '')
		.replace(
			'export default Component;',
			'const app = new Component({ target: document.body, props: {metadata: metadata} });'
		); // change some things to make it work
	let svelteTime = Date.now() - startTime;

	const vfs: { [key: string]: string } = {
		'main.js': js_code
	}; // virtual file system for esbuild

	const result = await esbuild.build({
		stdin: {
			contents: js_code,
			loader: 'js',
			sourcefile: 'input.mjs'
		},
		bundle: true,
		mainFields: ['svelte', 'browser', 'module', 'main'],
		conditions: ['svelte', 'browser'],
		plugins: [resolverPlugin(vfs), sveltePlugin()],
		write: false,
		outdir: 'out',
		treeShaking: true,
		// keepNames: true,
		minify: true
	}); // generate bundled js

	const compiled = result.outputFiles[0].text;

	const html = `
            <!DOCTYPE html>
            <html lang="en" class="dark">
            <head>
                <style>${svelte_obj.css.code ?? ''}</style>
				<style>
				img {
		margin: 0 auto;
	}</style>
            </head>
            <body style="background: transparent;" data-theme="wintry">
                <script type="module">
                    ${compiled}
                </script>
            </body>
            </html>
        `; // generate html
	let esbuildTime = Date.now() - startTime;

	console.log(
		`svelte: ${svelteTime}ms, esbuild: ${esbuildTime}ms, total: ${Date.now() - startTime}ms`
	);

	return html;
}
