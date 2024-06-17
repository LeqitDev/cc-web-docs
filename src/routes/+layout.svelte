<script>
	import { onMount } from 'svelte';
	import '../app.css';
	import { init } from "$lib/esbuild_compile";
	import { esbuild_init } from '$lib/clientStore';
</script>

<slot></slot>

<style></style>
