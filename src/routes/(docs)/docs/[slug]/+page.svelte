<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { PageData } from './$types';
	import { format, formatDistance } from 'date-fns';
	import ToC from '$lib/components/ToC.svelte';
	import { esbuildCompile } from '$lib/esbuild_compile';

	export let data: PageData;

	let iFrameContainer: HTMLDivElement;
	$: headings = [] as { id: string; text: string; level: number; element: Element }[];
	let tags: string[] = [];

	onMount(async () => {
		if (data.entry) {
			createIFrame(await esbuildCompile(data.entry.body));
			tags = data.entry.frontmatter?.tags.split(',') ?? [];
		}
	});

	function queryForEach(query: string, callback: (element: Element) => void) {
		const elements = iFrameContainer.querySelectorAll(query);
		if (elements) {
			elements.forEach(callback);
		}
	}

	function createIFrame(iframeContent: string) {
		const myBlob = new Blob([iframeContent], { type: 'application/javascript' });
		const myUrl = URL.createObjectURL(myBlob);

		import(/* @vite-ignore */myUrl).then(({ default: Component }) => {
			new Component({ target: iFrameContainer });

			queryForEach('h2, h3, h4, h5, h6', (heading) => {
				const id = heading.id;
				const text = new DOMParser().parseFromString(heading.innerHTML, 'text/html').body.textContent ?? '';
				const level = parseInt(heading.tagName[1]);
				headings = [...headings, { id, text, level, element: heading }];
			});

			queryForEach('section[data-heading-rank="2"]', (section) => {
				section.classList.add('first:pt-2', 'pt-8');
			});
			
			queryForEach('.custom-block', (block) => {
				(block as HTMLElement).style.backgroundColor = '#2e3440ff';
			});

			queryForEach('.rehype-figure', (figure) => {
				figure.classList.add('my-4');
			});

			queryForEach('.rehype-figure img', (img) => {
				img.classList.add('mx-auto', 'rounded-md');
			});

			queryForEach('.rehype-figure figcaption', (caption) => {
				caption.classList.add('text-center', 'text-surface-400', 'text-sm', 'italic', 'mt-1');
			});

			if (window.location.hash) {
				const hash = window.location.hash.slice(1);
				const target = document.getElementById(hash);
				if (target) {
					const elementPosition = target.getBoundingClientRect().top;
					const offsetPosition = elementPosition - window.innerHeight * 0.05;
					window.scrollTo({
						top: offsetPosition,
						behavior: 'smooth'
					});
				}
			}
		});
	}

	function parseDate(date: string, strict = false) {
		const jsDate = new Date(date);

		// if date is less than a week old, return relative time
		const now = new Date();
		const diff = now.getTime() - jsDate.getTime();
		if (strict || diff >= 604800000) {
			let formatStr = 'MMMM d, yyyy';
			if (strict) {
				formatStr += ' (HH:mm)';
			}
			// console.log(formatStr);

			return 'on ' + format(jsDate, formatStr);
		} else {
			return formatDistance(jsDate, now, { addSuffix: true });
		}
	}
</script>

<svelte:head>
	{#if data.entry && data.entry.frontmatter}
		<title>{data.entry.frontmatter.title ?? 'Docs | cc-web'}</title>
	{/if}
</svelte:head>
<div class="m-auto flex min-h-screen w-full flex-col lg:w-10/12 xl:w-7/12">
	{#if data.entry}
		<div class="flex grow">
			<div
				bind:this={iFrameContainer}
				id="iframe-container"
				class="grow overflow-hidden px-2 pb-20 md:pr-6 lg:p-0"
			></div>
			<div class="sticky top-4 hidden h-min w-64 p-2 md:block">
				<ToC title={data.entry.title} bind:headings />
				<h2 class="h5 mb-2 mt-8 border-b font-semibold">Tags</h2>
				<div class="flex">
					{#each tags as tag}
						<a href={`/docs?tag=${tag}`} class="variant-filled-tertiary badge mr-2">{tag}</a>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
