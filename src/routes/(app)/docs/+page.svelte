<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { format } from 'date-fns';
	import Filter from '$lib/components/Filter.svelte';

	export let data: PageData;

	const tagParams = $page.url.searchParams.get('tags')?.split(',');

	console.log(data);

	$: list = data.entries.filter(
		(item) =>
			!tagParams || item.frontmatter?.tags.split(',').some((tag: string) => tagParams.includes(tag))
	);

	function onInput(value: string) {
		list = data.entries
			.filter(
				(item) =>
					!tagParams ||
					item.frontmatter?.tags.split(',').some((tag: string) => tagParams.includes(tag))
			)
			.filter((item) => item.title.toLowerCase().includes(value.toLowerCase()));
	}
</script>

<svelte:head>
	<title>Docs | cc-web.cloud</title>
</svelte:head>
<div class="mx-auto w-full lg:w-10/12 xl:w-7/12 mt-12">
	<Filter {tagParams} {onInput} />
	<div class="grid gap-6 mt-8">
		{#if list}
			{#each list as item}
				<div class="flex flex-col gap-2">
					<div class="flex">
						{#each item.frontmatter?.tags.split(',') as tag}
							<a href={`/docs?tags=${tag}`} class="variant-soft-tertiary badge mr-2">{tag}</a>
						{/each}
					</div>
					<div>
						<a
							class="h3 font-semibold hover:underline"
							href={'/docs/' + item.frontmatter?.slug ?? item.number}>{item.title}</a
						>
						<p class="text-sm text-gray-500">
							Created {format(new Date(item.created_at), 'dd MMM yyyy')}
							{#if format(new Date(item.created_at), 'dd MMM yyyy') !== format(new Date(item.updated_at), 'dd MMM yyyy')}•
								Updated {format(new Date(item.updated_at), 'dd MMM yyyy')}
							{/if}
						</p>
					</div>
					{#if item.frontmatter?.description}
						<p class="text-gray-300">{item.frontmatter.description}</p>
					{/if}
				</div>
			{:else}
				<p>No entries found</p>
			{/each}
		{/if}
	</div>
</div>
