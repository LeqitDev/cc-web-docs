<script lang="ts">
	import { onMount } from 'svelte';

	type MyImage = { id: number; src: string; deg: number; left: number; opacity: number };
	$: list = [] as MyImage[];

	let moving = false;
	const magicNumber = 300;

	function onMouseDown(e: any) {
		moving = true;
	}

	function onMouseUp(e: any) {
		moving = false;

		if (list[list.length - 1].left < magicNumber) {
			const entry = list[list.length - 1];

			let animation = setInterval(() => {
				if (moving) clearInterval(animation);
				entry.left -= 10;
				if (entry.left < 0) {
					entry.left = 0;
					clearInterval(animation);
				}
				entry.opacity = 1 - Math.abs(entry.left) / magicNumber;
				list = [...list];
			}, 100 / 60);
		}
	}

	function onMouseMove(e: any) {
		if (moving) {
			const off = e.movementX;

			const entry = list[list.length - 1];
			if (entry.left + off < 0) return;
			entry.left += off;

			entry.opacity = 1 - Math.abs(entry.left) / magicNumber;

			if (entry.left > magicNumber) {
				moving = false;
				// pop last element
				list = list.slice(0, list.length - 1);
			} else {
				list = [...list];
			}
		}
	}

	let max = 0;

	onMount(async () => {
		const response = await fetch('https://api.github.com/repos/LeqitDev/panda-img-cloud/contents', {
			headers: {
				Accept: 'application/vnd.github.object+json',
				'X-GitHub-Api-Version': '2022-11-28',
				Authorization: 'Bearer ' + import.meta.env.VITE_PANDA_GITHUB_TOKEN
			}
		});

		let fetchedFiles = (await response.json()) as App.PandaPicture[];

		fetchedFiles = fetchedFiles.filter((file) => file.name.endsWith('.webp'));
        // TODO: await all return list 
		fetchedFiles.forEach(async (file, i) => {
			const resp = await fetch(file.url, {
				headers: {
					Accept: 'application/vnd.github.object+json',
					'X-GitHub-Api-Version': '2022-11-28',
					Authorization: 'Bearer ' + import.meta.env.VITE_PANDA_GITHUB_TOKEN
				}
			});

			list = [
				...list,
				{
					id: i,
					src: 'data:image/png;base64,' + (await resp.json()).content,
					deg: Math.random() * 20 - 10,
					left: 0,
					opacity: 1
				}
			];
            max = list.length;
		});
        console.log(list);
	});
</script>

<div class="relative mx-8 my-6 h-72 w-56 select-none">
	{#each list.slice(Math.max(0, list.length - 6), list.length) as person}
		<!-- svelte-ignore a11y-interactive-supports-focus -->
		<div
			class="shadow-card absolute flex h-72 w-56 select-none flex-col items-center rounded-md bg-secondary-100 px-2 pt-6"
			style={`left: ${person.left}px; opacity: ${person.opacity}; rotate: ${person.deg}deg;`}
			on:mousedown={onMouseDown}
			on:mouseup={onMouseUp}
			on:mousemove={onMouseMove}
			role="button"
		>
			<img
				src={person.src}
				style="max-height: 208px; display: block;"
				alt="img"
				class="select-none"
				on:dragstart|preventDefault={() => {}}
			/>
			{#if person.id === max}
				<p
					class="h4 mt-3 select-none bg-gradient-to-br from-secondary-600 to-surface-800 box-decoration-clone bg-clip-text font-caveat font-bold text-transparent"
				>
					Swipe right for more :)
				</p>
			{/if}
		</div>
	{/each}
</div>

<style>
	.shadow-card {
		box-shadow:
			rgba(0, 0, 0, 0.25) 0px 54px 55px,
			rgba(0, 0, 0, 0.12) 0px -12px 30px,
			rgba(0, 0, 0, 0.12) 0px 4px 6px,
			rgba(0, 0, 0, 0.17) 0px 12px 13px,
			rgba(0, 0, 0, 0.09) 0px -3px 5px;
	}
</style>
