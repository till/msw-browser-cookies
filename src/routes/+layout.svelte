<script>
    import { onMount } from 'svelte';
    import { dev } from '$app/environment'

    onMount(async() => {
        if (dev) {
            console.debug('dev mode 👉 including MSW')
            const { worker } = await import('./../mocks/browser')
            worker.start()
        }
    })
</script>
<main>
    <slot />
</main>

