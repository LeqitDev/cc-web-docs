<script>
    export let type = 'note';
    export let title = '';
</script>

<div class={`admonition admonition-${type}`}>
    {#if title}
        <h4>{title}</h4>
    {/if}
    <slot />
</div>