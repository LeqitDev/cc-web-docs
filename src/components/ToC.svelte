<script lang="ts">
    export let headings: { id: string; text: string; level: number }[];
    export let target: HTMLIFrameElement;


    function handleClick(id: string) {
        target.contentWindow?.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth'});
    }
</script>

<h2>Table of Contents</h2>
    {#each headings as { id, text, level }}
            <button class="text-start w-full" style="margin-left: {(level - 2) * 1}rem" on:click={() => handleClick(id)}>{@html text}</button>
    {/each}