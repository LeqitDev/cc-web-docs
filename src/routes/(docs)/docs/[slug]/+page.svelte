<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { PageData } from './$types';
	import { format, formatDistance } from 'date-fns';
	import ToC from '$lib/components/ToC.svelte';
	import { esbuildCompile } from '$lib/esbuild_compile';
	import WidgetLoader from '$lib/components/WidgetLoader.svelte';

	export let data: PageData;

	$: headings = [] as { id: string; text: string; level: number; element: Element }[];
	let tags: string[] = [];

	let widget: any;

	onMount(async () => {
		if (data.entry) {
			await esbuildCompile(data.entry.body, createIFrame);
			tags = data.entry.frontmatter?.tags.split(',') ?? [];
		}
	});

	function queryForEach(target: Element, query: string, callback: (element: Element) => void) {
		const elements = target.querySelectorAll(query);
		if (elements) {
			elements.forEach(callback);
		}
	}

	function createIFrame(iframeContent: string) {
		const myBlob = new Blob([iframeContent], { type: 'application/javascript' });
		const myUrl = URL.createObjectURL(myBlob);

		import(/* @vite-ignore */ myUrl).then((module) => {
			widget = module.default;
		});
	}

	function onComponentLoad(target: HTMLDivElement) {
		if (headings.length === 0) {
			queryForEach(target, 'h2, h3, h4, h5, h6', (heading) => {
				const id = heading.id;
				const text =
					new DOMParser().parseFromString(heading.innerHTML, 'text/html').body.textContent ?? '';
				const level = parseInt(heading.tagName[1]);
				const t = heading.getBoundingClientRect().top;
				headings = [...headings, { id, text, level, element: heading }];
			});
		}

		queryForEach(target, 'section[data-heading-rank="2"]', (section) => {
			section.classList.add('first:pt-2', 'pt-8');
		});

		if (window.location.hash) {
			const hash = window.location.hash.slice(1);
			const target = document.getElementById(hash);
			if (target) {
				const elementPosition = target.getBoundingClientRect().top;
				const offsetPosition = elementPosition - window.innerHeight * 0.05 + window.scrollY;
				window.scrollTo({
					top: offsetPosition,
					behavior: 'smooth'
				});
			}
		}
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
<div class="m-auto flex min-h-screen w-full flex-col lg:w-10/12 xl:w-9/12 2xl:w-7/12">
	{#if data.entry}
		<div class="flex grow">
			<div class="grow">
				{#if widget}
					<WidgetLoader this={widget} {onComponentLoad} />
				{/if}
			</div>
			<div class="sticky top-4 hidden h-min w-64 p-2 md:block">
				<ToC title={data.entry.title} bind:headings />
				<h2 class="h5 mb-2 mt-8 border-b font-semibold">Tags</h2>
				<div class="flex">
					{#each tags as tag}
						<a href={`/docs?tags=${tag}`} class="variant-filled-tertiary badge mr-2">{tag}</a>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
