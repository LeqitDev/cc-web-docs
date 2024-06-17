<script lang="ts">
	import type { PageData } from "./$types";

	export let data: PageData;
</script>


<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
{#if data.entries}
    {#each data.entries as item}
        <a href={"/docs/" + item.frontmatter?.slug ?? item.number}>{item.title}</a> {item.created_at} {item.updated_at} {item.frontmatter?.title}<br>
    {:else}
        <p>No entries found</p>
    {/each}
{/if}