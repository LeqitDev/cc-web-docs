import type { Load } from '@sveltejs/kit';
import { compile } from 'mdsvex';
import { compile as compileSvelte } from 'svelte/compiler';
import * as esbuild from "esbuild";
import sveltePlugin from "esbuild-svelte";

export const prerender = true;
export const ssr = false;

function fromBinary(encoded: string): string {
    return decodeURIComponent(atob(encoded).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
}

const resolverPlugin = (vfs: { [key: string]: string }) => {
    return {
        name: 'unpkg-path-plugin',
        setup(build: any) {
            const fileCache = new Map();

            build.onResolve({ filter: /.*/ }, async (args: any) => {
                if (args.path.includes('./') || args.path.includes('../')) {
                    return {
                        namespace: 'unpkg',
                        path: new URL(args.path, 'https://unpkg.com' + args.resolveDir + '/').href
                    };
                }
                return {
                    namespace: 'unpkg',
                    path: 'https://unpkg.com/' + args.path
                }
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

                const response = await fetch(args.path);
                const contents = await response.text();

                const result = {
                    loader: 'js',
                    contents,
                    resolveDir: new URL('./', response.url).pathname,
                }

                await fileCache.set(args.path, result);

                return result;
            });
        }
    }
};

export const load: Load = async ({ params }) => {
	let response = await fetch(
		'https://api.github.com/repos/LeqitDev/cc-docs/contents/' + params.slug + '?ref=main',
		{
			headers: {
				Accept: 'application/vnd.github+json',
				'X-GitHub-Api-Version': '2022-11-28',
				Authorization: 'Bearer ' + import.meta.env.VITE_GITHUB_TOKEN
			}
		}
	);
	const json = await response.json();
	let data = fromBinary(json.content);
	let mdsvex_obj = await compile(data);
	if (mdsvex_obj) {
		console.log(mdsvex_obj.code);

		let svelte_obj = compileSvelte(mdsvex_obj.code, { generate: 'dom', hydratable: false });
        const js_code = svelte_obj.js.code.replaceAll('svelte/internal', 'svelte/src/runtime/internal');

        const vfs: { [key: string]: string } = {
            'main.js': js_code,
        }

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
            // minify: true
        });

        const compiled = result.outputFiles[0].text.replace('var input_default = Component;', 'const app = new Component({ target: document.body });');

		const html = `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <style>${svelte_obj.css.code ?? ''}</style>
            </head>
            <body>
                <script type="module">
                    ${compiled}
                </script>
            </body>
            </html>
        `;
		console.log(html);

		return {
			url: html,
            js: js_code
		};
	}

	return {
		url: null
	};
};
