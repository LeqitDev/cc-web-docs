<script>
	import '../../app.css';
	import { page } from '$app/stores';

	$: current = $page.url.pathname.startsWith('/docs') ? 'docs' : $page.url.pathname.startsWith('/blog') ? 'blog' : 'home';
</script>

<div class="flex justify-between items-center w-full lg:w-10/12 xl:w-7/12 mx-auto py-2 px-1">
	<a href="/" class="font-caveat font-bold h2 bg-gradient-to-br from-secondary-600 to-tertiary-400 bg-clip-text text-transparent box-decoration-clone">cc-web.cloud.</a>
	<div class="flex gap-2">
		<a href="/" class="btn btn-sm rounded-md hover:variant-ghost-primary data-[active='true']:bg-gradient-to-br data-[active='true']:variant-gradient-primary-secondary" data-active={current === "home" ? true : false}>Home</a>
		<a href="/docs" class="btn btn-sm rounded-md hover:variant-ghost-primary data-[active='true']:bg-gradient-to-br data-[active='true']:variant-gradient-primary-secondary" data-active={current === "docs" ? true : false}>Docs</a>
		<a href="/blog" class="btn btn-sm rounded-md hover:variant-ghost-primary data-[active='true']:bg-gradient-to-br data-[active='true']:variant-gradient-primary-secondary" data-active={current === "blog" ? true : false}>Blog</a>
	</div>
</div>

<slot></slot>

<style></style>
