<script lang="ts">
	import { createForm } from '@tanstack/svelte-form';
	import GalleryVerticalEndIcon from '@lucide/svelte/icons/gallery-vertical-end';
	import EyeIcon from '@lucide/svelte/icons/eye';
	import EyeOffIcon from '@lucide/svelte/icons/eye-off';
	import { Button } from '$lib/components/ui/button/index.js';
	import { Input } from '$lib/components/ui/input/index.js';
	import * as InputGroup from '$lib/components/ui/input-group/index.js';
	import * as Field from '$lib/components/ui/field/index.js';
	import GithubIcon from '@iconify-svelte/mdi/github';
	import GoogleIcon from '@iconify-svelte/mdi/google';
	import { authClient } from '$lib/auth/client.js';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { z } from 'zod';
	import { FieldError } from '$lib/components/ui/field/index.js';

	const emailValidator = z.email('Enter a valid email address');
	const passwordValidator = z.string().min(8, 'Password must be at least 8 characters');

	let serverError = $state('');
	let submitting = $state(false);

	const form = createForm(() => ({
		defaultValues: {
			email: '',
			password: ''
		},
		onSubmit: async ({ value }) => {
			serverError = '';
			submitting = true;

			try {
				const { error } = await authClient.signIn.email({
					email: value.email,
					password: value.password
				});

				if (error) {
					serverError = error.message ?? 'Unable to sign in. Please try again.';
					return;
				}

				const redirectTo = page.url.searchParams.get('redirectTo');
				const target =
					redirectTo && redirectTo.startsWith('/') && !redirectTo.startsWith('//')
						? redirectTo
						: '/home';

				// `target` is a runtime-validated in-app path; `resolve` only prepends the app base path.
				await goto(resolve(target as '/home'));
			} finally {
				submitting = false;
			}
		}
	}));

	function getInputValue(event: Event): string {
		return (event.currentTarget as HTMLInputElement).value;
	}

	function handleGoogleLogin() {
		void authClient.signIn.social({ provider: 'google', callbackURL: resolve('/home') });
	}

	function handleGithubLogin() {
		void authClient.signIn.social({ provider: 'github', callbackURL: resolve('/home') });
	}

	let showPassword = $state(false);
</script>

<main class="flex flex-1 items-center justify-center px-4 sm:px-6">
	<div class="w-full max-w-md">
		<form
			onsubmit={(event) => {
				event.preventDefault();
				event.stopPropagation();
				form.handleSubmit();
			}}
		>
			<Field.Group>
				<Field.Field>
					<div class="flex flex-col items-center gap-2 text-center">
						<a href="##" class="flex flex-col items-center gap-2 font-medium">
							<div class="flex size-8 items-center justify-center rounded-md">
								<GalleryVerticalEndIcon class="size-6" />
							</div>
							<span class="sr-only">Acme Inc.</span>
						</a>
						<h1 class="text-xl font-bold">Welcome to Acme Inc.</h1>
						<p
							class="text-left text-sm leading-normal font-normal text-muted-foreground group-has-data-[orientation=horizontal]/field:text-balance last:mt-0 nth-last-2:-mt-1 [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary [[data-variant=legend]+&]:-mt-1.5"
						>
							Don't have an account? <a href={resolve('/auth/signup')}>Sign up</a>
						</p>
					</div>
				</Field.Field>
				<form.Field name="email" validators={{ onChange: emailValidator }}>
					{#snippet children(field)}
						<Field.Field>
							<Field.Label for={field.name}>Email</Field.Label>
							<Input
								id={field.name}
								name={field.name}
								type="email"
								placeholder="m@example.com"
								autocomplete="email"
								required
								value={field.state.value}
								onblur={field.handleBlur}
								oninput={(event) => field.handleChange(getInputValue(event))}
							/>
							<FieldError
								errors={field.state.meta.errors.filter((e) => e !== undefined)}
							/>
						</Field.Field>
					{/snippet}
				</form.Field>
				<form.Field name="password" validators={{ onChange: passwordValidator }}>
					{#snippet children(field)}
						<Field.Field>
							<Field.Label for={field.name}>Password</Field.Label>
							<InputGroup.Root>
								<InputGroup.Input
									id={field.name}
									name={field.name}
									type={showPassword ? 'text' : 'password'}
									placeholder="••••••••"
									autocomplete="current-password"
									required
									value={field.state.value}
									onblur={field.handleBlur}
									oninput={(event) => field.handleChange(getInputValue(event))}
								/>
								<InputGroup.Addon align="inline-end">
									<InputGroup.Button
										size="icon-xs"
										aria-label={showPassword
											? 'Hide password'
											: 'Show password'}
										aria-pressed={showPassword}
										onclick={() => (showPassword = !showPassword)}
									>
										{#if showPassword}
											<EyeOffIcon />
										{:else}
											<EyeIcon />
										{/if}
									</InputGroup.Button>
								</InputGroup.Addon>
							</InputGroup.Root>
							<FieldError
								errors={field.state.meta.errors.filter((e) => e !== undefined)}
							/>
						</Field.Field>
					{/snippet}
				</form.Field>
				{#if serverError}
					<FieldError errors={[{ message: serverError }]} />
				{/if}
				<Button type="submit" disabled={submitting}>
					{submitting ? 'Logging in…' : 'Login'}
				</Button>
				<Field.Separator>Or</Field.Separator>
				<Field.Field class="grid w-full gap-4 sm:grid-cols-2">
					<Button variant="outline" type="button" onclick={handleGoogleLogin}>
						<GoogleIcon height="1em" />
						Continue with Google
					</Button>
					<Button variant="outline" type="button" onclick={handleGithubLogin}>
						<GithubIcon height="1em" />
						Continue with Github
					</Button>
				</Field.Field>
			</Field.Group>
		</form>
		<p
			class="px-6 py-4 text-center text-sm leading-normal font-normal text-muted-foreground group-has-data-[orientation=horizontal]/field:text-balance last:mt-0 nth-last-2:-mt-1 [&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary [[data-variant=legend]+&]:-mt-1.5"
		>
			By clicking continue, you agree to our <a href="##">Terms of Service</a> and
			<a href="##">Privacy Policy</a>.
		</p>
	</div>
</main>
