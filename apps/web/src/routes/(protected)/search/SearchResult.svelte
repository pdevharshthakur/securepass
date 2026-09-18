<script lang="ts">
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import * as InputGroup from '$lib/components/ui/input-group';
	import type { SearchResult } from '@packages/shared';

	let { result }: { result: SearchResult } = $props();
	let revealed = $state(false);
</script>

<div class="rounded-lg border border-border bg-card p-4 shadow-sm">
	<div class="min-w-0">
		<p class="font-medium">{result.label}</p>
		<p class="truncate text-sm text-muted-foreground">{result.username}</p>
	</div>
	<InputGroup.Root class="mt-3 font-mono">
		<InputGroup.Input
			type={revealed ? 'text' : 'password'}
			value={result.password}
			readonly
			aria-label="Password for {result.label}"
			class="font-mono"
		/>
		<InputGroup.Addon align="inline-end">
			<InputGroup.Button
				size="icon-xs"
				variant="ghost"
				aria-label={revealed ? 'Hide password' : 'Show password'}
				aria-pressed={revealed}
				onclick={() => (revealed = !revealed)}
			>
				{#if revealed}
					<EyeOffIcon />
				{:else}
					<EyeIcon />
				{/if}
			</InputGroup.Button>
		</InputGroup.Addon>
	</InputGroup.Root>
</div>
