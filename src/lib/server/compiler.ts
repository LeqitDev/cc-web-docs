// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import { compile } from 'mdsvex/dist/browser-umd';
import { compile as compileSvelte } from 'svelte/compiler';
import rehypeRewrite from 'rehype-rewrite';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import rehypeFigure from 'rehype-figure';
import remarkBreaks from 'remark-breaks';
import rehypeHeadingIds from 'rehype-slug-custom-id';
import { codeToHtml } from 'shiki';
import type { Element } from 'hast';
import type { Node, Parent } from 'unist';
import { visit, SKIP } from 'unist-util-visit';
import type { Plugin } from 'unified';

function addClass(node: Element, className: string) {
	if (node.properties.className) {
		node.properties.className += ` ${className}`;
	} else {
		node.properties.className = className;
	}
}

interface Heading extends Node {
	type: 'element';
	tagName: string;
	properties: { [key: string]: unknown };
	children: Node[];
  }

  interface SuperNode extends Node {
	value: string | undefined;
  }

  interface SuperParent extends Parent {
	children: SuperNode[];
	tagName: string;
	properties: { [key: string]: unknown };
  }

const isHeading = (node: Node): node is Heading => ["h2", "h3", "h4", "h5", "h6"].includes((node as Heading).tagName);

const wrapSectionsPlugin: Plugin = () => {
	return (tree: Node) => {
		visit(tree, 'element', function (node: SuperNode, index: number | undefined, parent: SuperParent | undefined) {
			if (!isHeading(node) || !parent || typeof index !== "number") return;

			const section: SuperParent = {
				type: 'element',
				tagName: 'section',
				properties: {},
				children: []
			};

			let end = index + 1;

			const openTags = [] as string[];

			while (end < parent.children.length && !isHeading(parent.children[end])) {
				if (parent.children[end].value && parent.children[end].value?.startsWith('<')) {
					// match opening tags like <div> or <div class="myclass"> both schould be matched as div
					const match = parent.children[end].value?.match(/<([A-z]+)(?:\s|>)/);
					if (match) {
						openTags.push(match[1]);
					}
					// match closing tags like </div> should remove the last opening tag
					const matchClose = parent.children[end].value?.match(/<\/([A-z]+)>/);
					if (openTags.length > 0 && matchClose && matchClose[1] === openTags[openTags.length - 1]) {
						openTags.pop();
					} else {
						break;
					}
				}
				end++;
			}

			section.children = parent.children.slice(index, end);
			parent.children.splice(index, end - index, (section as unknown as SuperNode));

			return [SKIP, index + 1];
		});
		return;
	};
};

export async function compileMDsveX(issue: App.Issue) {
	const mdsvex_obj = await compile(issue.body, {
		remarkPlugins: [
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			remarkBreaks
		],
		rehypePlugins: [
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			[
				rehypeRewrite,
				{
					// eslint-disable-next-line @typescript-eslint/ban-ts-comment
					// @ts-ignore
					rewrite: (node: Element) => {
						switch (node.tagName) {
							case 'h2':
								addClass(node, 'h3 font-semibold border-b mb-4 pb-2');
								break;
							case 'h3':
								addClass(node, 'h4 font-semibold mt-6 mb-2');
								break;
							case 'h4':
								addClass(node, 'h5 font-semibold mt-4 mb-2');
								break;
							case 'h5':
								addClass(node, 'h6 font-semibold mt-4 mb-2');
								break;
							case 'h6':
								addClass(node, 'h6 font-semibold mt-4 mb-2');
								break;
							case 'code':
								addClass(node, 'bg-surface-500/50 rounded-md p-0.5 font-mono');
								break;
							case 'a':
								addClass(node, 'text-secondary-500 hover:underline');
								break;
						}
					}
				}
			],
			rehypeFigure,
			rehypeHeadingIds,
			wrapSectionsPlugin,
		],
		highlight: {
			highlighter: async (code: string, lang: string | undefined | null) => {
				if (!lang) return `<pre><code>${code}</code></pre>`;

				const options: { [key: string]: string } = {
					header: 'true'
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
				${options.header === 'true' ? header : ''}
				<div class="px-1 py-0.5">
				${html}
				</div>
				</div>
				\` }
				`;
			}
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
		.replace('export { metadata };', '');

	return issue;
}
