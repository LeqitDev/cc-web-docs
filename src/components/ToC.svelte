<script lang="ts">
	import { afterUpdate } from 'svelte';
	import { ProgressRadial } from '@skeletonlabs/skeleton';

	export let headings: { id: string; text: string; level: number; element: Element }[];
	export let target: HTMLIFrameElement;
	let loaded = false;

	$: activeId = intersecting.find((e) => e.isIntersecting)?.target.id ?? '';
	$: intersecting = [] as { target: Element; isIntersecting: boolean }[];

	const observer = new IntersectionObserver(
		(entries) => {
			entries.forEach((entry) => {
				if (intersecting.find((e) => e.target == entry.target)) {
					intersecting = intersecting.map((e) =>
						e.target == entry.target
							? { target: e.target, isIntersecting: entry.isIntersecting }
							: e
					);
				} else {
					intersecting = [
						...intersecting,
						{ target: entry.target, isIntersecting: entry.isIntersecting }
					];
				}
			});
		},
		{
			rootMargin: '0px 0px 0% 0px',
			threshold: 0.5
		}
	);

	afterUpdate(() => {
		if (headings.length > 0 && !loaded) {
			observer.disconnect();

			headings.forEach(({ id, element }) => {
				observer.observe(element);
			});

			loaded = true;
		}
	});

	function handleClick(id: string) {
		target.contentWindow?.document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
	}
</script>

<h2 class="h4 font-semibold border-b mb-2">Table of Contents</h2>
{#each headings as { id, text, level }}
	<button
		class={`w-full text-start hover:text-gray-200 ml-1 my-0.5${activeId === id ? ' font-semibold' : ' text-gray-400'}`}
		style="padding-left: {(level - 2) * 1}rem"
		data-heading-id={id}
		on:click={() => handleClick(id)}>{@html text}</button
	>
{:else}
	<br class="mb-12">
{/each}
