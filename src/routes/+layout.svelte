<script>
	import { onMount } from 'svelte';
	import '../app.css';
	import { init } from "$lib/esbuild_compile";
	import { esbuild_init } from '$lib/store';

	onMount(() => {
		if (!$esbuild_init) {
			init();
			esbuild_init.set(true);
		}
	})
</script>

<slot></slot>

<style></style>
