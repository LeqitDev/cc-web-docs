<script lang="ts">
	import { afterUpdate } from 'svelte';

	type Heading = { id: string; text: string; level: number; element: Element };
	type HeadingTree = { id: string; parent: HeadingTree | null; text: string; level: number; children: HeadingTree[] };
	type HeadingIntersecting = { target: Element; isIntersecting: boolean; intersectingRect: DOMRectReadOnly };

	export let headings: Heading[];
	export let target: HTMLIFrameElement;
	export let title = 'Table of Contents';
	let loaded = false;
	$: tree = [] as HeadingTree[];

	function buildTree() {
		const root = { id: '', parent: null, text: '', level: 0, children: [] } as HeadingTree;
		let current = root;
		let stack = [root];
		headings.forEach((h) => {
			const node = { id: h.id, parent: current, text: h.text, level: h.level, children: [] } as HeadingTree;
			if (h.level > current.level) {
				current.children.push(node);
				stack.push(current);
				current = node;
			} else if (h.level === current.level) {
				current.parent?.children.push(node);
				current = node;
			} else {
				while (h.level <= current.level) {
					current = stack.pop()!;
				}
				current.children.push(node);
				stack.push(current);
				current = node;
			}
		});
		tree = root.children;
	}

	// ids of the headings that are intersecting for each depth the first one that is intersecting
	// $: activeId = rankIntersecting(intersecting);
	$: intersecting = [] as HeadingIntersecting[];
	$: ranks = [] as string[];

	var ticking: boolean = false;
	type IntersectingType = { heading: Heading; top: number; height: number };
	$: rankedHeadings = [] as IntersectingType[];

	function gaussian(x: number, mean: number, stdDev: number): number {
		return Math.exp(-Math.pow(x - mean, 2) / (2 * Math.pow(stdDev, 2)));
	}

	function catchHeadings(scrollY: number) {
		let intersecting = [] as IntersectingType[];
		headings.forEach((h) => {
			const rect = h.element.parentElement?.getBoundingClientRect();
			if (rect) {
				const top = rect.top - scrollY;
				if (top >= 0 && top < window.innerHeight || top < 0 && top + rect.height > 0) {
					const height = top + rect.height > window.innerHeight ? window.innerHeight - top : rect.height;
					intersecting = [...intersecting, { heading: h, top: top < 0 ? top / window.innerHeight : top, height }];
				}
			}
		});

		const mean = window.innerHeight * 0.05;
		const stdDev = window.innerHeight * 0.1;

		const rankHeading = (i: IntersectingType) => (gaussian(i.top, mean, stdDev) * 0.99);

		intersecting.sort((a, b) => {
			const aScore = rankHeading(a);
			const bScore = rankHeading(b);

			return bScore - aScore;
		});

		if (intersecting.length > 0) {
			const highest = intersecting[0];
			let ids = [highest.heading.id];
			// bfs to find the path to the id on the tree
			let queue = [...tree];
			while (queue.length > 0) {
				const node = queue.shift();
				if (node) {
					if (node.id === highest.heading.id) {
						let current = node;
						while (current.parent) {
							console.log(current.id);
							
							ids = [current.parent.id, ...ids];
							current = current.parent;
						}
						break;
					}
					queue = [...queue, ...node.children];
				}
			}
		}
		rankedHeadings = intersecting;
		ranks = intersecting.map((i) => `${i.heading.id}: ${rankHeading(i)}, ${i.top.toFixed(3)}, ${(i.height/window.innerHeight).toFixed(3)}`);
	}

	afterUpdate(() => {
		if (!loaded && headings.length > 0) {
			buildTree();
			console.log(tree);

			rankedHeadings = [{ heading: headings[0], top: 0, height: 0 }];
			
			loaded = true;
		}
	});

	function onScroll() {
		const lastKnownScrollPosition = window.scrollY;

		if (!ticking) {
			window.requestAnimationFrame(() => {
				catchHeadings(lastKnownScrollPosition);
				ticking = false;
			});

			ticking = true;
		}
	}
	
	
	function scrollDelay(ms: number) {
		return new Promise(res => setTimeout(res, ms));
	}

	async function handleClick(id: string) {
		const el = target.contentWindow?.document.getElementById(id);
		if (el) {
			const elementPosition = el.getBoundingClientRect().top;
			const offsetPosition = elementPosition - window.innerHeight * 0.05;
			window.scrollTo({
				top: offsetPosition,
				behavior: 'smooth'
			});

			// TODO: make this a bit more elegant and change the ui
			await scrollDelay(100);
			el.parentElement!.style.outline = '2px solid #d41976';
			await scrollDelay(1000);
			el.parentElement!.style.outline = 'none';
		}
	}
</script>

<svelte:window on:scroll={onScroll} />

<!-- <div class="fixed top-10 left-10 pr-8 pt-8 text-gray-400 text-sm">
	{#each ranks as r}
		<p>{r}</p>
	{/each}
</div> -->
<div>
	<div class="flex gap-2">
		<a href="/" class="btn btn-sm rounded-md hover:variant-ghost-primary">Home</a>
		<a href="/docs" class="btn btn-sm rounded-md hover:variant-ghost-primary">Docs</a>
		<a href="/blog" class="btn btn-sm rounded-md hover:variant-ghost-primary">Blog</a>
	</div>
	<h2 class="h3 font-bold border-b mb-2 mt-4">{title}</h2>
</div>
{#each headings as { id, text, level }}
	<button
		class={`w-full text-start hover:text-gray-200 ml-1 my-0.5${rankedHeadings[0]?.heading.id === id ? ' font-semibold' : ' text-gray-400'}`}
		style="padding-left: {(level - 2) * 1}rem"
		data-heading-id={id}
		on:click={() => handleClick(id)}>{@html text}</button
	>
{:else}
	<br class="mb-12">
{/each}
