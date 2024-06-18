<script lang="ts">
	import type { PageData } from "./$types";
    import { page } from '$app/stores';

	export let data: PageData;

    const tagParam = $page.url.searchParams.get('tag');
    
    $: list = data.entries.filter((item) => !tagParam || item.frontmatter?.tags.split(',').includes($page.url.searchParams.get('tag') ?? ''));
</script>


<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
{#if list}
    {#each list as item}
        <a href={"/docs/" + item.frontmatter?.slug ?? item.number}>{item.title}</a> {item.created_at} {item.updated_at} {item.frontmatter?.title}<br>
    {:else}
        <p>No entries found</p>
    {/each}
{/if}