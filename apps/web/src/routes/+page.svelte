<script lang="ts">
	import { resolve } from '$app/paths';
	import GalleryVerticalEndIcon from '@lucide/svelte/icons/gallery-vertical-end';
	import { authClient } from '$lib/auth/client';
	import { Button } from '$lib/components/ui/button';

	const session = authClient.useSession();
</script>

<svelte:head>
	<title>securepass — Your secure password manager</title>
	<meta
		name="description"
		content="Keep your passwords encrypted, organised, and always within reach."
	/>
</svelte:head>

<main class="flex flex-1 items-center justify-center px-6">
	<div class="mb-36 flex w-full max-w-2xl flex-col items-center gap-8 text-center">
		<div class="flex flex-col items-center gap-8">
			<div class="flex size-10 items-center justify-center rounded-md border bg-muted/50">
				<GalleryVerticalEndIcon class="size-6" aria-hidden="true" />
			</div>
			<div class="flex flex-col items-center gap-3">
				<p class="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
					Your private password vault
				</p>
				<h1 class="text-5xl font-semibold tracking-normal sm:text-8xl">securepass</h1>
				<p
					class="max-w-lg leading-8 font-medium tracking-tighter text-muted-foreground sm:text-lg"
				>
					Your passwords, encrypted and always within reach.
				</p>
			</div>
		</div>

		<div class="flex flex-col gap-3 sm:flex-row">
			{#if $session.data}
				<Button
					size="lg"
					class="px-6"
					onclick={async () => {
						await authClient.signOut();
					}}
				>
					Logout
				</Button>
				<Button href={resolve('/home')} variant="outline" size="lg" class="px-6">
					Go to vault
				</Button>
			{:else}
				<Button href={resolve('/auth/login')} size="lg" class="px-6">Login</Button>
				<Button href={resolve('/about')} variant="outline" size="lg">Learn more</Button>
			{/if}
		</div>
	</div>
</main>
