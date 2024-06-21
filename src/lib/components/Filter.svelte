<script lang="ts">
    export let tagParams: string[] | undefined;
    export let onInput = (value: string) => {};

    function inputHandler(event: Event) {
        onInput((event.target as HTMLInputElement).value);
    }
</script>

<div>
    <label for="filter" class="label">Search:</label>
    <input type="text" on:input={inputHandler} class="input pl-1" id="filter" />
    <div class="flex gap-2 mt-4">
        {#if tagParams}
            {#each tagParams as tag}
                <a href={`?tag=${tag}`} class="variant-soft-tertiary badge">{tag}</a>
            {/each}
        {/if}
    </div>
</div>