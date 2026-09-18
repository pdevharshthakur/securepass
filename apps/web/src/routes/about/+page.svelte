<script lang="ts">
	import GalleryVerticalEndIcon from '@lucide/svelte/icons/gallery-vertical-end';
</script>

<svelte:head>
	<title>About — securepass</title>
	<meta name="description" content="What securepass is and how it keeps your passwords safe." />
</svelte:head>

<main class="mb-32 flex flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
	<div class="flex w-full max-w-xl flex-col items-center gap-5">
		<div class="flex flex-col items-center gap-3">
			<div class="flex size-10 items-center justify-center rounded-md border bg-muted/50">
				<GalleryVerticalEndIcon class="size-6" aria-hidden="true" />
			</div>
			<p class="text-xs font-semibold tracking-[0.2em] text-primary uppercase">
				Your private password vault
			</p>
			<h1 class="text-3xl font-bold tracking-tight sm:text-4xl">About securepass</h1>
		</div>

		<div class="flex flex-col gap-4">
			<p class="leading-7 font-semibold tracking-tight text-pretty sm:text-lg">
				securepass is a simple yet secure password manager. Keep all your logins organised
				and easily accessible encrypted, always within reach.
			</p>
			<p class="leading-6 text-pretty text-muted-foreground">
				Every credential is sealed with AES-256-GCM before it ever touches the database,
				using a fresh random IV for each entry. The browser never sees a secret in plaintext
				encryption and decryption live entirely on the server, and only your authenticated
				session can unlock what is yours.
			</p>
			<p class="leading-6 text-pretty text-muted-foreground">
				Started as a cryptography college project, securepass pairs a SvelteKit front end
				with an Express API, Better Auth sessions, and PostgreSQL at its core.
			</p>
		</div>
	</div>
</main>
