<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
    import * as esbuild from 'esbuild-wasm';

	export let data: PageData;

	let iFrameContainer: HTMLDivElement;

	onMount(async () => {
		if (!data.url) return;
		createIFrame(data.url);
	});

	function createIFrame(iframeContent: string) {
		let iFrame = document.createElement('iframe');
		iFrame.src = 'about:blank';
		iFrameContainer.innerHTML = ''; // (optional) Totally Clear it if needed
		iFrameContainer.appendChild(iFrame);

		let iFrameDoc = iFrame.contentWindow && iFrame.contentWindow.document;
		if (!iFrameDoc) {
			console.log('iFrame security.');
			return;
		}
		iFrameDoc.write(iframeContent);
		iFrameDoc.close();
	}
</script>

<div>
	<h1>Compile Svelte Component at Runtime</h1>
	<div bind:this={iFrameContainer}></div>
</div>
