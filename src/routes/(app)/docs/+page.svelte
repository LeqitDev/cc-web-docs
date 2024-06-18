<script lang="ts">
	import type { PageData } from './$types';
	import { page } from '$app/stores';
	import { format } from 'date-fns';

	export let data: PageData;

	const tagParam = $page.url.searchParams.get('tag');

	$: list = data.entries.filter(
		(item) =>
			!tagParam ||
			item.frontmatter?.tags.split(',').includes($page.url.searchParams.get('tag') ?? '')
	);
</script>

<div class="mx-auto w-full lg:w-10/12 xl:w-7/12 mt-12">
    <div class="grid gap-6">
	{#if list}
		{#each list as item}
			<div class="flex flex-col gap-2">
				<div class="flex">
					{#each item.frontmatter?.tags.split(',') as tag}
						<a href={`/docs?tag=${tag}`} class="variant-soft-tertiary badge mr-2">{tag}</a>
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
