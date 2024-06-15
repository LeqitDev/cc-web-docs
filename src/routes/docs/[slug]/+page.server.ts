import type { Load } from '@sveltejs/kit';
import { compile } from 'mdsvex';
import { compile as compileSvelte } from 'svelte/compiler';
import * as esbuild from 'esbuild';
import sveltePlugin from 'esbuild-svelte';
import axios from 'axios';
import { compileAndBundleSvelte, compileMDsveX } from '$lib/server/compiler';
import { get } from 'svelte/store';
import { doc_entries } from '$lib/store';

export const prerender = true;
export const ssr = false;

// atob with utf-8 https://stackoverflow.com/a/30106551
function fromBinary(encoded: string): string {
	return decodeURIComponent(
		atob(encoded)
			.split('')
			.map(function (c) {
				return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
			})
			.join('')
	);
}

export const load: Load = async ({ params }) => {
	try {
		// add different slugs
        let entry = get(doc_entries).find((entry) => entry.number === Number(params.slug));
        if (entry) {
			if (!entry.compiled) {
				entry.body = await compileAndBundleSvelte(entry.body);
				entry.compiled = true;
			}
            return {
				entry: entry,
			};
        }
        let startTime = Date.now();
		let response = await fetch(
			'https://api.github.com/repos/LeqitDev/cc-web-docs/issues/' + params.slug,
			{
				headers: {
					Accept: 'application/vnd.github+json',
					'X-GitHub-Api-Version': '2022-11-28',
					Authorization: 'Bearer ' + import.meta.env.VITE_GITHUB_TOKEN
				}
			}
		); // get file from github
		const issue = await compileMDsveX(await response.json() as App.Issue);
		issue.body = await compileAndBundleSvelte(issue.body);
        let endTime = Date.now();
        console.log(`Fetched issue ${params.slug} in ${endTime - startTime}ms`);
        

		return {
			entry: issue,
		};
	} catch (e) {
		console.error(e);
	}

	return {
		entry: null,
	};
};
