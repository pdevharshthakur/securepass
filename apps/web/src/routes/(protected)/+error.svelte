<script lang="ts">
	import RefreshCwIcon from '@lucide/svelte/icons/refresh-cw';
	import { Button } from '$lib/components/ui/button';
	import { invalidateAll } from '$app/navigation';
	import { page } from '$app/state';

	function retry() {
		void invalidateAll();
	}
</script>

<svelte:head>
	<title>Internal server error | securepass</title>
</svelte:head>

<main class="flex flex-1 items-center justify-center px-6 py-16">
	<div class="flex max-w-md flex-col items-center gap-6 text-center">
		<div class="flex flex-col items-center gap-3">
			<p class="text-sm font-medium text-muted-foreground">Error {page.status}</p>
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">
				{page.status === 500
					? 'Server unavailable'
					: page.status === 404
						? 'Page not found'
						: 'Something went wrong'}
			</h1>
			<p class="text-muted-foreground">
				{page.status === 500
					? 'securepass could not verify your session because the backend is not responding. Your internet connection is working, so try again in a moment.'
					: page.status === 404
						? 'The page you requested does not exist.'
						: 'An unexpected error occurred. Please try again.'}
			</p>
		</div>

		{#if page.status === 500}
			<Button size="lg" onclick={retry}>
				<RefreshCwIcon data-icon="inline-start" />
				Try again
			</Button>
		{:else}
			<Button href="/home" size="lg">Go home</Button>
		{/if}
	</div>
</main>
