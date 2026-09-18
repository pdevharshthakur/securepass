<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import PlusIcon from '@lucide/svelte/icons/plus';
	import SearchIcon from '@lucide/svelte/icons/search';
	import { resolve } from '$app/paths';
</script>

<main class="mb-32 flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
	<div class="flex flex-col items-center gap-3">
		<h1 class="text-6xl font-bold tracking-tight sm:text-8xl">securepass</h1>
		<p class="max-w-md font-medium text-muted-foreground">
			Add or search the password you want here
		</p>
	</div>
	<div class="flex flex-col gap-3 sm:flex-row">
		<Button href={resolve('/add')} size="lg">
			<PlusIcon data-icon="inline-start" />
			Add a password
		</Button>
		<Button href={resolve('/search')} variant="outline" size="lg">
			<SearchIcon data-icon="inline-start" />
			Search passwords
		</Button>
	</div>
</main>
