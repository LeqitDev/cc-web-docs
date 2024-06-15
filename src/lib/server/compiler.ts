import { compile } from 'mdsvex';
import { compile as compileSvelte } from 'svelte/compiler';
import remarkHeadingId from "remark-heading-id";
import rehypeRewrite from "rehype-rewrite";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import rehypeFigure from "rehype-figure";
import { codeToHtml } from 'shiki';
import type { Element } from 'hast';

function addClass(node: Element, className: string) {
	if (node.properties.className) {
		node.properties.className += ` ${className}`;
	} else {
		node.properties.className = className;
	}
}

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
				rewrite: (node: Element) => {
					if (node.tagName === "h2") {
						addClass(node, "h2 font-semibold border-b first:pt-2 pt-8 mb-4 pb-2");
					} else if (node.tagName === "h3") {
						node.properties.className = "h3 font-semibold";
					} else if (node.tagName === "h4") {
						node.properties.className = "h4 font-semibold";
					} else if (node.tagName === "h5") {
						node.properties.className = "h5 font-semibold";
					} else if (node.tagName === "h6") {
						node.properties.className = "h6 font-semibold";
					}
				}
			}],
			rehypeFigure
		],
		highlight: {
			highlighter: async (code: string, lang: string | undefined | null ) => {
				if (!lang) return `<pre><code>${code}</code></pre>`;
				const html = await codeToHtml(code, { lang: lang, theme: 'nord' });
				
				return `
				{@html \`
				<div class="custom-block rounded-md my-2">
				<div class="custom-block-header flex items-center justify-between bg-secondary-500/50 rounded-t-md p-1">
				<span class="text-sm text-surface-300 ml-1 font-semibold">${lang}</span>
				<button class="cpycode chip variant-soft hover:variant-gradient-tertiary-primary hover:bg-gradient-to-br" onclick="copyToClipboard(this)">Copy<span class="hidden">${code}</span></button>
				</div>
				<div class="px-1 py-0.5">
				${html}
				</div>
				</div>
				\` }
				`;
			},
		}
	});

	if (mdsvex_obj) {
		issue.body = mdsvex_obj.code;
		issue.frontmatter = mdsvex_obj.data?.fm as { [key: string]: any };
	}

	return issue;
}

export async function compileMDsveXAndSvelte(issue: App.Issue) {
	issue = await compileMDsveX(issue);

	const svelte_obj = compileSvelte(issue.body, { generate: 'dom', hydratable: false }); // compile svelte
	issue.body = svelte_obj.js.code
		.replaceAll('svelte/internal', 'svelte/src/runtime/internal')
		.replace('export { metadata };', '')
		.replace(
			'export default Component;',
			'const app = new Component({ target: document.querySelector("#render-app"), props: {metadata: metadata} });'
		); // change some things to make it work
	
	return issue;
}