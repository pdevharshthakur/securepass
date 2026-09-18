<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { page } from '$app/state';
</script>

<svelte:head>
	<title>{page.status} | securepass</title>
</svelte:head>

<main class="flex flex-1 items-center justify-center px-6 py-16">
	<div class="flex max-w-md flex-col items-center gap-6 text-center">
		<div class="flex flex-col items-center gap-3">
			<p class="text-sm font-medium text-muted-foreground">Error {page.status}</p>
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">
				{page.status === 404 ? 'Page not found' : 'Something went wrong'}
			</h1>
			<p class="text-muted-foreground">
				{page.status === 404
					? 'The page you requested does not exist.'
					: 'An unexpected error occurred. Please try again.'}
			</p>
		</div>

		<Button href="/" size="lg">Go home</Button>
	</div>
</main>
