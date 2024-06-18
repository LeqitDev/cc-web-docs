<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import type { PageData } from './$types';
	import { format, formatDistance } from 'date-fns';
	import ToC from '$lib/components/ToC.svelte';
	import { esbuildCompile } from '$lib/esbuild_compile';

	export let data: PageData;

	let iFrameContainer: HTMLDivElement;
	let iFrame: HTMLIFrameElement;
	$: headings = [] as { id: string; text: string; level: number; element: Element }[];
	let tags: string[] = [];

	onMount(async () => {
		if (data.entry) {
			createIFrame(await esbuildCompile(data.entry.body));
			tags = data.entry.frontmatter?.tags.split(',') ?? [];
		}
	});

	function createIFrame(iframeContent: string) {
		iFrame = document.createElement('iframe');
		iFrame.src = 'about:blank';
		iFrame.width = '100%';
		iFrame.height = '100%';
		// iFrame.style.position = 'fixed';
		iFrameContainer.innerHTML = ''; // (optional) Totally Clear it if needed
		iFrameContainer.appendChild(iFrame);
		

		let iFrameDoc = iFrame.contentWindow && iFrame.contentWindow.document;
		if (!iFrameDoc) {
			console.log('iFrame security.');
			return;
		}
		iFrameDoc.write(iframeContent);

		// copy head styles
		let head = document.querySelector('head');
		if (head) {
			let styles = [...head.querySelectorAll('style'), ...head.querySelectorAll('link[rel="stylesheet"]')];
			styles.forEach((style) => {
				iFrameDoc.head.appendChild(style.cloneNode(true));
			});
		}

		iFrameDoc.close();

		// set height to content height
		iFrame.onload = () => {
			iFrame.height = iFrame.contentWindow?.document.body.scrollHeight + 'px';

			// table of contents/ headings crawler
			const queryHeadings = iFrame.contentWindow?.document.querySelectorAll('h2, h3, h4, h5, h6');
			// console.log(headings);
			if (queryHeadings) {
				queryHeadings.forEach((heading) => {
					const id = heading.id;
					const text = (new DOMParser()).parseFromString(heading.innerHTML, 'text/html').body.textContent ?? "";
					const level = parseInt(heading.tagName[1]);
					headings = [...headings, { id, text, level, element: heading}];
				});
				// console.log(headings);
				
			}

			// fix heading spacings
			const queryHeadingSections = iFrame.contentWindow?.document.querySelectorAll('section[data-heading-rank="2"]');

			if (queryHeadingSections) {
				queryHeadingSections.forEach((section) => {
					section.classList.add("first:pt-2", "pt-8");
				});
			}

			if (window.location.hash) {
				const hash = window.location.hash.slice(1);
				const target = iFrame.contentWindow?.document.getElementById(hash);
				if (target) {
					const elementPosition = target.getBoundingClientRect().top;
					const offsetPosition = elementPosition - window.innerHeight * 0.05;
					window.scrollTo({
						top: offsetPosition,
						behavior: 'smooth'
					});
				}
			}
			
			iFrame.height = iFrame.contentWindow?.document.body.scrollHeight + 'px';
		};
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
		<title>{data.entry.frontmatter.title ?? "Docs | cc-web"}</title>
	{/if}
</svelte:head>
<div class="min-h-screen max-w-5xl m-auto flex flex-col">
	{#if data.entry}
		<div class="flex grow">
			<div bind:this={iFrameContainer} id="iframe-container" class="overflow-hidden grow pr-6 pb-20"></div>
			<div class="w-60 h-min sticky top-4 p-2">
				<ToC title={data.entry.title} bind:headings={headings} target={iFrame} />
				<h2 class="h5 font-semibold border-b mt-8 mb-2">Tags</h2>
				<div class="flex">
					{#each tags as tag}
						<a href={`/docs?tag=${tag}`} class="badge variant-filled-tertiary mr-2">{tag}</a>
					{/each}
				</div>
			</div>
		</div>
	{/if}
</div>
