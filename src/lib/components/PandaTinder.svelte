<script lang="ts">
	import { pb } from '$lib/clientStore';
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
		const response = (await pb
			.collection('images')
			.getFullList({ filter: "tags = 'panda'", sort: '@random' })) as { id: string; img: string }[];
		let temp_list = [] as MyImage[];
		response.forEach((img, i) => {
			temp_list.push({
				id: i,
				src: pb.files.getUrl(img, img.img),
				deg: Math.random() * 20 - 10,
				left: 0,
				opacity: 1
			});
			list = temp_list;
			max = list.length - 1;
		});
	});
</script>

<div class="relative mx-8 my-6 h-72 w-56 select-none">
	{#each list.slice(Math.max(0, list.length - 5), list.length) as person}
		<!-- svelte-ignore a11y-interactive-supports-focus -->
		<div
			class="shadow-card absolute flex h-72 w-56 select-none flex-col items-center rounded-sm bg-secondary-100 px-2 pt-6"
			style={`opacity: ${person.opacity}; transform: translateX(${person.left}px) rotate(${person.deg}deg);`}
			on:mousedown={onMouseDown}
			on:mouseup={onMouseUp}
			on:mousemove={onMouseMove}
			role="button"
		>
			<img
				src={person.src}
				style="max-height: 208px; display: block;"
				alt="img"
				class="select-none rounded-sm w-48 h-48 object-cover"
				on:dragstart|preventDefault={() => {}}
			/>
			{#if person.id === max}
				<div class="h-100 grid grow items-center justify-center">
					<p
						class="h4 select-none bg-gradient-to-br from-secondary-600 to-surface-800 box-decoration-clone bg-clip-text font-caveat font-bold text-transparent"
					>
						Swipe right for more :)
					</p>
				</div>
			{/if}
		</div>
	{:else}
		<div
			class="shadow-card absolute flex h-72 w-56 select-none flex-col items-center rounded-sm bg-secondary-100 px-2 pt-6"
			role="button"
		>
			<div class="h-100 grow grid justify-center items-center">
				<p
					class="h4 select-none bg-gradient-to-br from-secondary-600 to-surface-800 box-decoration-clone bg-clip-text font-caveat font-bold text-transparent"
				>
					No more images :(
				</p>
			</div>
		</div>
	{/each}
</div>

<style>
	.shadow-card {
		box-shadow: rgba(0, 0, 0, 0.25) 0px 0.0625em 0.0625em, rgba(0, 0, 0, 0.25) 0px 0.125em 0.5em, rgba(255, 255, 255, 0.1) 0px 0px 0px 1px inset;
	}
</style>
