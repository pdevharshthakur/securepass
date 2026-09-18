<script lang="ts">
	import SearchIcon from '@lucide/svelte/icons/search';
	import { page } from '$app/state';
	import { Input } from '$lib/components/ui/input';
	import { Button } from '$lib/components/ui/button';
	import { searchEntries } from './search.remote';
	import SearchResult from './SearchResult.svelte';

	const id = $props.id();
	const label = $derived(page.url.searchParams.get('query')?.trim() ?? '');
</script>

<main class="flex flex-1 flex-col items-center justify-center gap-8 px-6 text-center">
	<div class="flex flex-col items-center gap-3">
		<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">Search passwords</h1>
		<p class="max-w-md text-muted-foreground">Type a label to find your saved entry</p>
	</div>

	<form class="flex w-full max-w-sm items-center gap-2" method="GET">
		<label class="sr-only" for="search-query-{id}">Search by label</label>
		<Input
			id="search-query-{id}"
			type="search"
			value={label}
			name="query"
			placeholder="Search by label..."
			required
			maxlength={255}
			pattern=".*\S.*"
			title="Enter a non-empty label"
		/>
		<Button type="submit">
			<SearchIcon data-icon="inline-start" />
			Search
		</Button>
	</form>

	{#if label}
		<svelte:boundary>
			{const data = await searchEntries({ label })}

			{#if data.results.length === 0}
				<p class="text-sm text-muted-foreground" role="status">
					No entries found for “{label}”.
				</p>
			{:else}
				{#key label}
					<div class="flex w-full max-w-sm flex-col gap-3 text-left" aria-live="polite">
						{#each data.results as result (result.id)}
							<SearchResult {result} />
						{/each}
					</div>
				{/key}
			{/if}

			{#snippet pending()}
				<p class="text-sm text-muted-foreground" role="status">Searching...</p>
			{/snippet}

			{#snippet failed(error, reset)}
				<p class="text-sm text-destructive" role="alert">
					{error instanceof Error ? error.message : 'Unable to search passwords'}
				</p>
				<Button type="button" variant="outline" onclick={reset}>Try again</Button>
			{/snippet}
		</svelte:boundary>
	{/if}
</main>
