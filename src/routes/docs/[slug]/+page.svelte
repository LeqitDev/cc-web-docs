<script lang="ts">
	import { onMount } from 'svelte';
	import type { PageData } from './$types';
	import { format, formatDistance, formatDistanceStrict } from 'date-fns';
	import ToC from '../../../components/ToC.svelte';

	export let data: PageData;

	let iFrameContainer: HTMLDivElement;
	let iFrame: HTMLIFrameElement;
	$: headings = [] as { id: string; text: string; level: number }[];
	let tags: string[] = [];

	onMount(async () => {
		if (data.entry) {
			createIFrame(data.entry.body);
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
			let styles = head.querySelectorAll('style');
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
			console.log(headings);
			if (queryHeadings) {
				queryHeadings.forEach((heading) => {
					const id = heading.id;
					const text = heading.innerHTML;
					const level = parseInt(heading.tagName[1]);
					headings = [...headings, { id, text, level }];
				});
				console.log(headings);
				
			}
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
			console.log(formatStr);

			return 'on ' + format(jsDate, formatStr);
		} else {
			return formatDistance(jsDate, now, { addSuffix: true });
		}
	}
</script>

<div class="min-h-screen max-w-4xl m-auto flex flex-col">
	{#if data.entry}
		<div class="flex">
			{#each tags as tag}
				<span class="badge variant-filled-tertiary mr-2">{tag}</span>
			{/each}
		</div>
		<h1 class="h1 font-bold">{data.entry.title}</h1>
		<div>
			<p class="date text-sm text-surface-400 font-semibold">
				Published {parseDate(data.entry.created_at)},
				{#if data.entry.updated_at !== data.entry.created_at}
					updated {parseDate(data.entry.updated_at, true)}.
				{/if}
			</p>
		</div>
		<hr class="!border-t-2 my-4 !border-secondary-500" />
		<div class="flex grow">
			<div class="max-w-xs h-min sticky top-0">
				<ToC bind:headings={headings} target={iFrame} />
			</div>
			<div bind:this={iFrameContainer} class="overflow-auto grow"></div>
		</div>
	{/if}
</div>
