<script lang="ts">
	import { onMount } from "svelte";
    import '$lib/styles/docs.scss';


    onMount(() => {
        console.log('DocsLayout');
    });
</script>

<div>
    <h1>Docs</h1>
    <slot />
</div>