<script lang="ts">
	import { onMount } from "svelte";
	import type { PageData } from "./$types";
	import { compile } from "svelte/compiler";

    export let data: PageData;
</script>
{#if data.obj}
    <div>{@html data.obj.code}</div>
{/if}