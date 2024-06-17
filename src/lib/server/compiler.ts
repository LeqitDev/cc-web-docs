
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { compile } from 'mdsvex/dist/browser-umd';
import { compile as compileSvelte } from 'svelte/compiler';
import rehypeRewrite from "rehype-rewrite";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import rehypeFigure from "rehype-figure";
import remarkBreaks from 'remark-breaks';
import rehypeSectionize from '@hbsnow/rehype-sectionize';
import rehypeHeadingIds from 'rehype-slug-custom-id';
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
	const mdsvex_obj = await compile(issue.body, {
		remarkPlugins: [
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			remarkBreaks,
		],
		rehypePlugins: [
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			[rehypeRewrite, {
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				rewrite: (node: Element) => {
					switch (node.tagName) {
						case "h2":
							addClass(node, "h2 font-semibold border-b first:pt-2 pt-8 mb-4 pb-2");
							break;
						case "h3":
							addClass(node, "h3 font-semibold mt-6 mb-2");
							break;
						case "h4":
							addClass(node, "h4 font-semibold mt-4 mb-2");
							break;
						case "h5":
							addClass(node, "h5 font-semibold mt-4 mb-2");
							break;
						case "h6":
							addClass(node, "h6 font-semibold mt-4 mb-2");
							break;
						case "code":
							addClass(node, "bg-surface-500/50 rounded-md p-0.5 font-mono");
							break;
						case "a":
							addClass(node, "text-secondary-500 hover:underline");
							break;
					}
				}
			}],
			rehypeFigure,
			rehypeHeadingIds,
			rehypeSectionize,
		],
		highlight: {
			highlighter: async (code: string, lang: string | undefined | null ) => {
				if (!lang) return `<pre><code>${code}</code></pre>`;

				const options: { [key: string]: string } = {
					header: "true",
				};

				if (lang.includes('?')) {
					const split = lang.split('?');
					lang = split[0];
					const optionsStr = split[1].split('&');
					optionsStr.forEach((option) => {
						const [key, value] = option.split('=');
						options[key] = value;
					});
				}

				const html = await codeToHtml(code, { lang: lang, theme: 'nord' });

				const header = `<div class="custom-block-header flex items-center justify-between bg-secondary-500/50 rounded-t-md p-1">
				<span class="text-sm text-surface-300 ml-1 font-semibold">${lang}</span>
				<button class="cpycode chip !bg-transparent hover:variant-gradient-tertiary-primary hover:bg-gradient-to-br" onclick="copyToClipboard(this)">Copy<span class="hidden">${code}</span></button>
				</div>`;
				
				return `
				{@html \`
				<div class="custom-block rounded-md my-2">
				${options.header === "true" ? header : ""}
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
		issue.frontmatter = mdsvex_obj.data?.fm as { [key: string]: string };
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