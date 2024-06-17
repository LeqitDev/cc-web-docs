// @ts-nocheck
import type { Load } from '@sveltejs/kit';
import { compileMDsveXAndSvelte } from '$lib/server/compiler';
import { get } from 'svelte/store';
import { doc_entries, fetch_doc_entries } from '$lib/store';

export const prerender = true;
export const ssr = false;

export const load = async ({ params }: Parameters<Load>[0]) => {
	try {
		// add different slugs
		const slug = Number(params.slug);
		let entry;
		if (isNaN(slug)) {
			entry = get(doc_entries).find((entry) => entry.frontmatter?.slug === params.slug);

			if (!entry) {
				await fetch_doc_entries();
				entry = get(doc_entries).find((entry) => entry.frontmatter?.slug === params.slug);

				if (!entry) {
					return {
						entry: null,
					};
				}
			}
		} else {
			entry = get(doc_entries).find((entry) => entry.number === slug);
		}

        if (entry) {
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
		const issue = await compileMDsveXAndSvelte(await response.json() as App.Issue);
        let endTime = Date.now();
        console.log(`Fetched issue ${params.slug} in ${endTime - startTime}ms`);

		doc_entries.update((entries) => {
			entries.push(issue);
			return entries;
		});

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
