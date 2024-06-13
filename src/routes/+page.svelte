<script lang="ts">
	import { onMount } from "svelte";
    import { compile } from "mdsvex";

    let data: any = null;
    onMount(async () => {
        if (!import.meta.env.VITE_GITHUB_TOKEN) {
            console.error("No GitHub token provided");
            return;
        }
        if (data != null) return;
        let response = await fetch('https://api.github.com/repos/LeqitDev/cc-docs/contents/', {
            headers: {
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
                "Authorization": "Bearer " + import.meta.env.VITE_GITHUB_TOKEN
            }
        });
        data = await response.json();
        console.log(data);
    });

    async function readFile(path: string): Promise<{ code: string; data?: Record<string, unknown> | undefined; map?: string | undefined; } | undefined> {
        let data = "";
        let response = await fetch('https://api.github.com/repos/LeqitDev/cc-docs/contents/' + path + '?ref=main', {
            headers: {
                "Accept": "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
                "Authorization": "Bearer " + import.meta.env.VITE_GITHUB_TOKEN
            }
        }).then(response => response.json()).then(d => {
            data = atob(d.content);
        });



        console.log(data);
        
        return await compile(data);
    }
</script>


<h1>Welcome to SvelteKit</h1>
<p>Visit <a href="https://kit.svelte.dev">kit.svelte.dev</a> to read the documentation</p>
{#if data}
    {#each data as item}
        <p>{item.name}</p>
        <div>
            {#await readFile(item.name)}
                Loading...
            {:then d} 
                {d}
            {/await}
        </div>
    {/each}
{/if}