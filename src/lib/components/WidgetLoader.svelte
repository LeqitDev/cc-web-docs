<!-- https://stackoverflow.com/a/65522522 -->

<script lang="ts">
    import { onDestroy } from 'svelte';
    import "$lib/styles/docs.scss"

    let component
    export { component as this }
    export let onComponentLoad = (target: HTMLDivElement) => { }

    let target: HTMLDivElement
    let cmp: any

    const create = () => {
        cmp = new component({ target, props: $$restProps })
        onComponentLoad(target)
    }

    const cleanup = () => {
        if (!cmp) return
        cmp.$destroy()
        cmp = null
    }

    $: if (component && target) {
        cleanup()
        create()
    }

    $: if (cmp) {
        cmp.$set($$restProps)
    }

    onDestroy(() => {
        cleanup()
    })
</script>

<div bind:this={target} id="external-widget-16" class="mb-20"></div>