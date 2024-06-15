import { compile } from 'mdsvex';
import { compile as compileSvelte } from 'svelte/compiler';
import remarkHeadingId from "remark-heading-id";
import rehypeRewrite from "rehype-rewrite";
import rehypeStringify from "rehype-stringify";

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
						node.properties.className = "h2 font-semibold border-b mb-4 pb-2";
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
			rehypeStringify
		],
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
			'const app = new Component({ target: document.body, props: {metadata: metadata} });'
		); // change some things to make it work
	
	return issue;
}